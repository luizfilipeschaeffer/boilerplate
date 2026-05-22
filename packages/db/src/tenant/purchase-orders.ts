import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { listLowStockItems } from "./stock";
import { resolveSupplierForCategory } from "./suppliers";
import { assertSafeSchemaName } from "./schema";
import { getCatalogItemById } from "./catalog";

export type PurchaseOrderStatus =
  | "rascunho"
  | "enviada"
  | "parcial"
  | "recebida"
  | "cancelada";

export interface PurchaseOrderRow {
  id: string;
  supplier_id: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  sent_at: Date | null;
  received_at: Date | null;
}

export interface PurchaseOrderLineRow {
  id: string;
  purchase_order_id: string;
  catalog_item_id: string;
  quantity: number;
  unit_cost_cents: number | null;
  notes: string | null;
  created_at: Date;
}

export interface PurchaseOrderWithLines extends PurchaseOrderRow {
  lines: PurchaseOrderLineRow[];
  supplier_name?: string;
}

function poTable(schemaName: string): string {
  return `"${schemaName}"."purchase_orders"`;
}

function poLinesTable(schemaName: string): string {
  return `"${schemaName}"."purchase_order_lines"`;
}

export async function listPurchaseOrders(
  schemaName: string,
): Promise<PurchaseOrderWithLines[]> {
  assertSafeSchemaName(schemaName);
  const orders = await prisma.$queryRawUnsafe<PurchaseOrderRow[]>(
    `SELECT po.id, po.supplier_id, po.status, po.notes, po.created_at, po.updated_at, po.sent_at, po.received_at
     FROM ${poTable(schemaName)} po
     ORDER BY po.created_at DESC`,
  );
  const result: PurchaseOrderWithLines[] = [];
  for (const po of orders) {
    const lines = await listPurchaseOrderLines(schemaName, po.id);
    const supplier = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM "${schemaName}"."suppliers" WHERE id = $1`,
      po.supplier_id,
    );
    result.push({
      ...po,
      lines,
      supplier_name: supplier[0]?.name,
    });
  }
  return result;
}

export async function getPurchaseOrderById(
  schemaName: string,
  id: string,
): Promise<PurchaseOrderWithLines | null> {
  assertSafeSchemaName(schemaName);
  const rows = await prisma.$queryRawUnsafe<PurchaseOrderRow[]>(
    `SELECT id, supplier_id, status, notes, created_at, updated_at, sent_at, received_at
     FROM ${poTable(schemaName)} WHERE id = $1`,
    id,
  );
  const po = rows[0];
  if (!po) return null;
  const lines = await listPurchaseOrderLines(schemaName, id);
  const supplier = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM "${schemaName}"."suppliers" WHERE id = $1`,
    po.supplier_id,
  );
  return { ...po, lines, supplier_name: supplier[0]?.name };
}

async function listPurchaseOrderLines(
  schemaName: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderLineRow[]> {
  return prisma.$queryRawUnsafe<PurchaseOrderLineRow[]>(
    `SELECT id, purchase_order_id, catalog_item_id, quantity, unit_cost_cents, notes, created_at
     FROM ${poLinesTable(schemaName)} WHERE purchase_order_id = $1
     ORDER BY created_at ASC`,
    purchaseOrderId,
  );
}

export async function createPurchaseOrder(
  schemaName: string,
  data: {
    supplierId: string;
    notes?: string | null;
    lines: { catalogItemId: string; quantity: number; unitCostCents?: number | null; notes?: string | null }[];
  },
): Promise<PurchaseOrderWithLines> {
  assertSafeSchemaName(schemaName);
  const poId = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${poTable(schemaName)} (id, supplier_id, status, notes)
     VALUES ($1, $2, 'rascunho', $3)`,
    poId,
    data.supplierId,
    data.notes ?? null,
  );
  for (const line of data.lines) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${poLinesTable(schemaName)} (id, purchase_order_id, catalog_item_id, quantity, unit_cost_cents, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      randomUUID(),
      poId,
      line.catalogItemId,
      line.quantity,
      line.unitCostCents ?? null,
      line.notes ?? null,
    );
  }
  const created = await getPurchaseOrderById(schemaName, poId);
  return created!;
}

export async function updatePurchaseOrderStatus(
  schemaName: string,
  id: string,
  status: PurchaseOrderStatus,
): Promise<PurchaseOrderWithLines> {
  assertSafeSchemaName(schemaName);
  const sentAt = status === "enviada" ? new Date() : null;
  const receivedAt = status === "recebida" ? new Date() : null;
  await prisma.$executeRawUnsafe(
    `UPDATE ${poTable(schemaName)}
     SET status = $2,
         updated_at = NOW(),
         sent_at = COALESCE(sent_at, $3),
         received_at = COALESCE(received_at, $4)
     WHERE id = $1`,
    id,
    status,
    sentAt,
    receivedAt,
  );
  const updated = await getPurchaseOrderById(schemaName, id);
  if (!updated) throw new Error("Ordem de compra não encontrada");
  return updated;
}

export async function updatePurchaseOrderLines(
  schemaName: string,
  purchaseOrderId: string,
  lines: { catalogItemId: string; quantity: number; unitCostCents?: number | null }[],
): Promise<PurchaseOrderWithLines> {
  assertSafeSchemaName(schemaName);
  const po = await getPurchaseOrderById(schemaName, purchaseOrderId);
  if (!po) throw new Error("Ordem de compra não encontrada");
  if (po.status !== "rascunho") {
    throw new Error("Só é possível editar ordens em rascunho.");
  }
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${poLinesTable(schemaName)} WHERE purchase_order_id = $1`,
    purchaseOrderId,
  );
  for (const line of lines) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${poLinesTable(schemaName)} (id, purchase_order_id, catalog_item_id, quantity, unit_cost_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      randomUUID(),
      purchaseOrderId,
      line.catalogItemId,
      line.quantity,
      line.unitCostCents ?? null,
    );
  }
  const updated = await getPurchaseOrderById(schemaName, purchaseOrderId);
  return updated!;
}

export interface LowStockPendingItem {
  catalogItemId: string;
  name: string;
  stockQty: number;
  stockMin: number;
  reason: "sem_categoria" | "sem_fornecedor";
}

export interface GeneratePurchaseOrdersResult {
  created: PurchaseOrderWithLines[];
  pending: LowStockPendingItem[];
}

export async function generatePurchaseOrdersFromLowStock(
  schemaName: string,
): Promise<GeneratePurchaseOrdersResult> {
  assertSafeSchemaName(schemaName);
  const low = await listLowStockItems(schemaName);
  const bySupplier = new Map<
    string,
    { catalogItemId: string; quantity: number }[]
  >();
  const pending: LowStockPendingItem[] = [];

  for (const item of low) {
    const catalog = await getCatalogItemById(schemaName, item.id);
    const categoryId = catalog?.category_id ?? null;

    if (!categoryId) {
      pending.push({
        catalogItemId: item.id,
        name: item.name,
        stockQty: item.stock_qty,
        stockMin: item.stock_min,
        reason: "sem_categoria",
      });
      continue;
    }

    const supplierId = await resolveSupplierForCategory(schemaName, categoryId);
    if (!supplierId) {
      pending.push({
        catalogItemId: item.id,
        name: item.name,
        stockQty: item.stock_qty,
        stockMin: item.stock_min,
        reason: "sem_fornecedor",
      });
      continue;
    }

    const qty = Math.max(item.stock_min - item.stock_qty, 1);
    const list = bySupplier.get(supplierId) ?? [];
    list.push({ catalogItemId: item.id, quantity: qty });
    bySupplier.set(supplierId, list);
  }

  const created: PurchaseOrderWithLines[] = [];
  for (const [supplierId, lines] of bySupplier) {
    const po = await createPurchaseOrder(schemaName, {
      supplierId,
      notes: "Gerada automaticamente a partir de estoque baixo",
      lines,
    });
    created.push(po);
  }

  return { created, pending };
}
