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

export type SaleStatus = "confirmada" | "cancelada";
export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "outro";

export interface SaleRow {
  id: string;
  client_id: string | null;
  seller_id: string | null;
  status: string;
  payment_method: string;
  total_cents: number;
  idempotency_key: string | null;
  created_at: Date;
}

export interface SaleItemRow {
  id: string;
  sale_id: string;
  catalog_item_id: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface SaleWithItems extends SaleRow {
  items: (SaleItemRow & { item_name: string })[];
  client_name: string | null;
}

export async function listSales(
  schemaName: string,
  limit = 50,
): Promise<SaleWithItems[]> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);
  const itemsTable = tenantSaleItemsTable(schemaName);
  const schema = schemaName;

  const sales = await prisma.$queryRawUnsafe<SaleRow[]>(
    `SELECT id, client_id, seller_id, status, payment_method, total_cents, idempotency_key, created_at
     FROM ${salesTable}
     WHERE status = 'confirmada' OR status IS NULL
     ORDER BY created_at DESC
     LIMIT $1`,
    limit,
  );

  const result: SaleWithItems[] = [];
  for (const sale of sales) {
    const items = await prisma.$queryRawUnsafe<
      (SaleItemRow & { item_name: string })[]
    >(
      `SELECT si.id, si.sale_id, si.catalog_item_id, si.quantity, si.unit_price_cents, si.line_total_cents,
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
    result.push({ ...sale, items, client_name });
  }
  return result;
}

export async function createSale(
  schemaName: string,
  input: {
    clientId?: string | null;
    sellerId?: string | null;
    paymentMethod: PaymentMethod;
    lines: { catalogItemId: string; quantity: number }[];
    idempotencyKey?: string | null;
    branchId?: string | null;
  },
): Promise<SaleWithItems> {
  assertSafeSchemaName(schemaName);
  if (input.lines.length === 0) throw new Error("Adicione ao menos um item");

  const salesTable = tenantSalesTable(schemaName);
  if (input.idempotencyKey) {
    const existing = await prisma.$queryRawUnsafe<SaleRow[]>(
      `SELECT id FROM ${salesTable} WHERE idempotency_key = $1`,
      input.idempotencyKey,
    );
    if (existing[0]) {
      const all = await listSales(schemaName, 200);
      const found = all.find((s) => s.id === existing[0]!.id);
      if (found) return found;
    }
  }

  const saleId = randomUUID();
  const itemsTable = tenantSaleItemsTable(schemaName);
  let totalCents = 0;
  const prepared: {
    catalogItemId: string;
    quantity: number;
    unitPriceCents: number;
    lineTotal: number;
    itemType: string;
  }[] = [];

  for (const line of input.lines) {
    const item = await getCatalogItemById(schemaName, line.catalogItemId);
    if (!item) throw new Error(`Item não encontrado: ${line.catalogItemId}`);
    const qty = Math.max(1, Math.floor(line.quantity));
    const unit = item.price_cents ?? 0;
    const lineTotal = unit * qty;
    totalCents += lineTotal;
    prepared.push({
      catalogItemId: item.id,
      quantity: qty,
      unitPriceCents: unit,
      lineTotal,
      itemType: item.item_type,
    });
  }

  const descontaEstoque = await isAprendizEnabled(
    schemaName,
    "venda-desconta-estoque",
  );

  for (const line of prepared) {
    if (line.itemType === "produto" && descontaEstoque) {
      const item = await getCatalogItemById(schemaName, line.catalogItemId);
      if (item && item.stock_qty < line.quantity) {
        throw new Error(`Estoque insuficiente para ${item.name}`);
      }
    }
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${salesTable} (id, client_id, seller_id, branch_id, status, payment_method, total_cents, idempotency_key)
     VALUES ($1, $2, $3, $4, 'confirmada', $5, $6, $7)`,
    saleId,
    input.clientId ?? null,
    input.sellerId ?? null,
    input.branchId ?? null,
    input.paymentMethod,
    totalCents,
    input.idempotencyKey ?? null,
  );

  for (const line of prepared) {
    const itemId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${itemsTable} (id, sale_id, catalog_item_id, quantity, unit_price_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      itemId,
      saleId,
      line.catalogItemId,
      line.quantity,
      line.unitPriceCents,
      line.lineTotal,
    );
    if (line.itemType === "produto" && descontaEstoque) {
      await decreaseStockForSale(schemaName, line.catalogItemId, line.quantity);
    }
  }

  try {
    await recordSaleCashInflow(schemaName, saleId, totalCents);
  } catch {
    /* fluxo de caixa opcional até migração do tenant */
  }

  const all = await listSales(schemaName, 200);
  const created = all.find((s) => s.id === saleId);
  if (!created) throw new Error("Venda não encontrada após criação");
  return created;
}
