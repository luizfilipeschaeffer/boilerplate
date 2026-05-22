import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import {
  assertSafeSchemaName,
  tenantSaleItemsTable,
  tenantSalesTable,
} from "./schema";
import { getCatalogItemById } from "./catalog";
import { decreaseStockForSale } from "./stock";
import { isAprendizEnabled } from "./aprendiz";
import { recordSaleCashInflow } from "./cash-flow";
import type { PaymentMethod } from "./sales";

export type OrderStatus = "rascunho" | "pedido" | "confirmada" | "cancelada";

export interface OrderRow {
  id: string;
  client_id: string | null;
  seller_id: string | null;
  branch_id: string | null;
  status: string;
  payment_method: string;
  total_cents: number;
  notes: string | null;
  allowed_payment_methods: string[] | null;
  converted_at: Date | null;
  created_at: Date;
}

export interface OrderWithItems extends OrderRow {
  items: {
    id: string;
    catalog_item_id: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    item_name: string;
  }[];
  client_name: string | null;
  seller_name: string | null;
}

function parseAllowedMethods(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function listOrders(
  schemaName: string,
  opts?: { status?: OrderStatus[]; branchId?: string | null; limit?: number },
): Promise<OrderWithItems[]> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);
  const itemsTable = tenantSaleItemsTable(schemaName);
  const schema = schemaName;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (opts?.status?.length) {
    conditions.push(`status = ANY($${idx++}::text[])`);
    params.push(opts.status);
  } else {
    conditions.push(`status IN ('rascunho', 'pedido')`);
  }

  if (opts?.branchId) {
    conditions.push(`branch_id = $${idx++}`);
    params.push(opts.branchId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(opts?.limit ?? 100);

  const sales = await prisma.$queryRawUnsafe<
    (OrderRow & { allowed_payment_methods: unknown })[]
  >(
    `SELECT id, client_id, seller_id, branch_id, status, payment_method, total_cents,
            notes, allowed_payment_methods, converted_at, created_at
     FROM ${salesTable}
     ${where}
     ORDER BY created_at DESC
     LIMIT $${idx}`,
    ...params,
  );

  const result: OrderWithItems[] = [];
  for (const sale of sales) {
    const items = await prisma.$queryRawUnsafe<
      OrderWithItems["items"]
    >(
      `SELECT si.id, si.catalog_item_id, si.quantity, si.unit_price_cents, si.line_total_cents,
              ci.name AS item_name
       FROM ${itemsTable} si
       JOIN "${schema}"."catalog_items" ci ON ci.id = si.catalog_item_id
       WHERE si.sale_id = $1`,
      sale.id,
    );
    let client_name: string | null = null;
    if (sale.client_id) {
      const clients = await prisma.$queryRawUnsafe<{ name: string }[]>(
        `SELECT name FROM "${schema}"."clients" WHERE id = $1`,
        sale.client_id,
      );
      client_name = clients[0]?.name ?? null;
    }
    let seller_name: string | null = null;
    if (sale.seller_id) {
      const sellers = await prisma.$queryRawUnsafe<{ name: string }[]>(
        `SELECT name FROM "${schema}"."sellers" WHERE id = $1`,
        sale.seller_id,
      );
      seller_name = sellers[0]?.name ?? null;
    }
    result.push({
      ...sale,
      allowed_payment_methods: parseAllowedMethods(sale.allowed_payment_methods),
      items,
      client_name,
      seller_name,
    });
  }
  return result;
}

export async function getOrderById(
  schemaName: string,
  orderId: string,
): Promise<OrderWithItems | null> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    (OrderRow & { allowed_payment_methods: unknown })[]
  >(
    `SELECT id, client_id, seller_id, branch_id, status, payment_method, total_cents,
            notes, allowed_payment_methods, converted_at, created_at
     FROM ${salesTable} WHERE id = $1`,
    orderId,
  );
  const sale = rows[0];
  if (!sale) return null;
  const itemsTable = tenantSaleItemsTable(schemaName);
  const schema = schemaName;
  const items = await prisma.$queryRawUnsafe<OrderWithItems["items"]>(
    `SELECT si.id, si.catalog_item_id, si.quantity, si.unit_price_cents, si.line_total_cents,
            ci.name AS item_name
     FROM ${itemsTable} si
     JOIN "${schema}"."catalog_items" ci ON ci.id = si.catalog_item_id
     WHERE si.sale_id = $1`,
    orderId,
  );
  let client_name: string | null = null;
  if (sale.client_id) {
    const clients = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM "${schema}"."clients" WHERE id = $1`,
      sale.client_id,
    );
    client_name = clients[0]?.name ?? null;
  }
  let seller_name: string | null = null;
  if (sale.seller_id) {
    const sellers = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM "${schema}"."sellers" WHERE id = $1`,
      sale.seller_id,
    );
    seller_name = sellers[0]?.name ?? null;
  }
  return {
    ...sale,
    allowed_payment_methods: parseAllowedMethods(sale.allowed_payment_methods),
    items,
    client_name,
    seller_name,
  };
}

export async function upsertOrder(
  schemaName: string,
  input: {
    orderId?: string;
    clientId?: string | null;
    sellerId?: string | null;
    branchId?: string | null;
    status?: "rascunho" | "pedido";
    notes?: string | null;
    allowedPaymentMethodCodes?: string[] | null;
    lines: { catalogItemId: string; quantity: number }[];
  },
): Promise<OrderWithItems> {
  assertSafeSchemaName(schemaName);
  if (input.lines.length === 0) throw new Error("Adicione ao menos um item");

  const salesTable = tenantSalesTable(schemaName);
  const itemsTable = tenantSaleItemsTable(schemaName);
  const orderId = input.orderId ?? randomUUID();
  const status = input.status ?? "pedido";

  let totalCents = 0;
  const prepared: {
    catalogItemId: string;
    quantity: number;
    unitPriceCents: number;
    lineTotal: number;
  }[] = [];

  for (const line of input.lines) {
    const item = await getCatalogItemById(schemaName, line.catalogItemId);
    if (!item) throw new Error(`Item não encontrado`);
    const qty = Math.max(1, Math.floor(line.quantity));
    const unit = item.price_cents ?? 0;
    const lineTotal = unit * qty;
    totalCents += lineTotal;
    prepared.push({
      catalogItemId: item.id,
      quantity: qty,
      unitPriceCents: unit,
      lineTotal,
    });
  }

  const allowedJson = input.allowedPaymentMethodCodes?.length
    ? JSON.stringify(input.allowedPaymentMethodCodes)
    : null;

  const existing = input.orderId
    ? await prisma.$queryRawUnsafe<{ id: string; status: string }[]>(
        `SELECT id, status FROM ${salesTable} WHERE id = $1`,
        orderId,
      )
    : [];

  if (existing[0]) {
    if (!["rascunho", "pedido"].includes(existing[0].status)) {
      throw new Error("Pedido já foi convertido ou cancelado");
    }
    await prisma.$executeRawUnsafe(
      `UPDATE ${salesTable}
       SET client_id = $2, seller_id = $3, branch_id = $4, status = $5, total_cents = $6,
           notes = $7, allowed_payment_methods = $8::jsonb, payment_method = COALESCE(payment_method, 'dinheiro')
       WHERE id = $1`,
      orderId,
      input.clientId ?? null,
      input.sellerId ?? null,
      input.branchId ?? null,
      status,
      totalCents,
      input.notes ?? null,
      allowedJson,
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM ${itemsTable} WHERE sale_id = $1`,
      orderId,
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${salesTable}
       (id, client_id, seller_id, branch_id, status, payment_method, total_cents, notes, allowed_payment_methods)
       VALUES ($1, $2, $3, $4, $5, 'dinheiro', $6, $7, $8::jsonb)`,
      orderId,
      input.clientId ?? null,
      input.sellerId ?? null,
      input.branchId ?? null,
      status,
      totalCents,
      input.notes ?? null,
      allowedJson,
    );
  }

  for (const line of prepared) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${itemsTable} (id, sale_id, catalog_item_id, quantity, unit_price_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      randomUUID(),
      orderId,
      line.catalogItemId,
      line.quantity,
      line.unitPriceCents,
      line.lineTotal,
    );
  }

  const order = await getOrderById(schemaName, orderId);
  if (!order) throw new Error("Pedido não encontrado após salvar");
  return order;
}

export async function convertOrderToSale(
  schemaName: string,
  orderId: string,
  paymentMethod: PaymentMethod,
): Promise<OrderWithItems> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);
  const order = await getOrderById(schemaName, orderId);
  if (!order) throw new Error("Pedido não encontrado");
  if (!["rascunho", "pedido"].includes(order.status)) {
    throw new Error("Este pedido já foi processado");
  }

  const allowed = order.allowed_payment_methods;
  if (allowed?.length && !allowed.includes(paymentMethod)) {
    throw new Error("Forma de pagamento não permitida neste pedido");
  }

  const descontaEstoque = await isAprendizEnabled(
    schemaName,
    "venda-desconta-estoque",
  );

  if (descontaEstoque) {
    for (const line of order.items) {
      const item = await getCatalogItemById(schemaName, line.catalog_item_id);
      if (item?.item_type === "produto" && item.stock_qty < line.quantity) {
        throw new Error(`Estoque insuficiente para ${item.name}`);
      }
    }
  }

  await prisma.$executeRawUnsafe(
    `UPDATE ${salesTable}
     SET status = 'confirmada', payment_method = $2, converted_at = NOW()
     WHERE id = $1`,
    orderId,
    paymentMethod,
  );

  if (descontaEstoque) {
    for (const line of order.items) {
      const item = await getCatalogItemById(schemaName, line.catalog_item_id);
      if (item?.item_type === "produto") {
        await decreaseStockForSale(
          schemaName,
          line.catalog_item_id,
          line.quantity,
        );
      }
    }
  }

  try {
    await recordSaleCashInflow(schemaName, orderId, order.total_cents);
  } catch {
    /* optional */
  }

  const updated = await getOrderById(schemaName, orderId);
  if (!updated) throw new Error("Venda não encontrada após conversão");
  return updated;
}

export async function cancelOrder(
  schemaName: string,
  orderId: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${salesTable} SET status = 'cancelada' WHERE id = $1 AND status IN ('rascunho', 'pedido')`,
    orderId,
  );
}
