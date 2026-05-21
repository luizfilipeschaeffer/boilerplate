import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import {
  assertSafeSchemaName,
  tenantCatalogTable,
  tenantStockMovementsTable,
} from "./schema";
import { getCatalogItemById, type CatalogItemRow } from "./catalog";

export type StockMovementType = "entrada" | "saida" | "ajuste";

export interface StockMovementRow {
  id: string;
  catalog_item_id: string;
  movement_type: string;
  quantity: number;
  note: string | null;
  created_at: Date;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock_qty: number;
  stock_min: number;
}

export async function listLowStockItems(
  schemaName: string,
): Promise<LowStockItem[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  return prisma.$queryRawUnsafe<LowStockItem[]>(
    `SELECT id, name, stock_qty, stock_min
     FROM ${table}
     WHERE item_type = 'produto' AND stock_min > 0 AND stock_qty <= stock_min
     ORDER BY stock_qty ASC`,
  );
}

export async function adjustStock(
  schemaName: string,
  input: {
    catalogItemId: string;
    movementType: StockMovementType;
    quantity: number;
    note?: string | null;
  },
): Promise<{ item: CatalogItemRow; movement: StockMovementRow }> {
  assertSafeSchemaName(schemaName);
  const qty = Math.abs(Math.floor(input.quantity));
  if (qty <= 0) throw new Error("Quantidade inválida");

  const item = await getCatalogItemById(schemaName, input.catalogItemId);
  if (!item) throw new Error("Item não encontrado");
  if (item.item_type !== "produto") {
    throw new Error("Serviços não possuem controle de estoque");
  }

  let delta = qty;
  if (input.movementType === "saida") delta = -qty;
  if (input.movementType === "ajuste") {
    delta = qty - item.stock_qty;
  }

  const newQty = item.stock_qty + delta;
  if (newQty < 0) throw new Error("Estoque insuficiente");

  const catalogTable = tenantCatalogTable(schemaName);
  const movTable = tenantStockMovementsTable(schemaName);
  const movId = randomUUID();

  await prisma.$executeRawUnsafe(
    `UPDATE ${catalogTable} SET stock_qty = $1, updated_at = NOW() WHERE id = $2`,
    newQty,
    item.id,
  );

  const movements = await prisma.$queryRawUnsafe<StockMovementRow[]>(
    `INSERT INTO ${movTable} (id, catalog_item_id, movement_type, quantity, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, catalog_item_id, movement_type, quantity, note, created_at`,
    movId,
    item.id,
    input.movementType,
    qty,
    input.note ?? null,
  );

  const updated = await getCatalogItemById(schemaName, item.id);
  return { item: updated!, movement: movements[0]! };
}

export async function decreaseStockForSale(
  schemaName: string,
  catalogItemId: string,
  quantity: number,
): Promise<CatalogItemRow> {
  const { item } = await adjustStock(schemaName, {
    catalogItemId,
    movementType: "saida",
    quantity,
    note: "Baixa automática — venda confirmada",
  });
  return item;
}

export async function setStockMinimum(
  schemaName: string,
  catalogItemId: string,
  stockMin: number,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET stock_min = $1, updated_at = NOW() WHERE id = $2 AND item_type = 'produto'`,
    Math.max(0, Math.floor(stockMin)),
    catalogItemId,
  );
}
