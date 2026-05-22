import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { assertSafeSchemaName, tenantCatalogTable } from "./schema";

export type CatalogItemType = "produto" | "servico";

export interface CatalogItemRow {
  id: string;
  name: string;
  item_type: string;
  sku: string | null;
  price_cents: number | null;
  stock_qty: number;
  stock_min: number;
  category_id: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function listCatalogItems(
  schemaName: string,
): Promise<CatalogItemRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  return prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `SELECT id, name, item_type, sku, price_cents, stock_qty, stock_min, category_id, active, created_at, updated_at
     FROM ${table}
     ORDER BY active DESC, name ASC`,
  );
}

export async function getCatalogItemById(
  schemaName: string,
  id: string,
): Promise<CatalogItemRow | null> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `SELECT id, name, item_type, sku, price_cents, stock_qty, stock_min, category_id, active, created_at, updated_at
     FROM ${table} WHERE id = $1`,
    id,
  );
  return rows[0] ?? null;
}

export async function createCatalogItem(
  schemaName: string,
  data: {
    name: string;
    itemType: CatalogItemType;
    sku?: string | null;
    priceCents?: number | null;
    categoryId?: string | null;
  },
): Promise<CatalogItemRow> {
  assertSafeSchemaName(schemaName);
  const id = randomUUID();
  const table = tenantCatalogTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `INSERT INTO ${table} (id, name, item_type, sku, price_cents, category_id, active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, name, item_type, sku, price_cents, stock_qty, stock_min, category_id, active, created_at, updated_at`,
    id,
    data.name,
    data.itemType,
    data.sku ?? null,
    data.priceCents ?? null,
    data.categoryId ?? null,
  );
  return rows[0]!;
}

export async function updateCatalogItem(
  schemaName: string,
  id: string,
  data: {
    name: string;
    itemType: CatalogItemType;
    sku?: string | null;
    priceCents?: number | null;
    categoryId?: string | null;
  },
): Promise<CatalogItemRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `UPDATE ${table}
     SET name = $2, item_type = $3, sku = $4, price_cents = $5, category_id = $6, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, item_type, sku, price_cents, stock_qty, stock_min, category_id, active, created_at, updated_at`,
    id,
    data.name,
    data.itemType,
    data.sku ?? null,
    data.priceCents ?? null,
    data.categoryId ?? null,
  );
  if (!rows[0]) throw new Error("Item não encontrado");
  return rows[0];
}

export async function setCatalogItemActive(
  schemaName: string,
  id: string,
  active: boolean,
): Promise<CatalogItemRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `UPDATE ${table}
     SET active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, item_type, sku, price_cents, stock_qty, stock_min, category_id, active, created_at, updated_at`,
    id,
    active,
  );
  if (!rows[0]) throw new Error("Item não encontrado");
  return rows[0];
}

export async function listCatalogItemsByCategoryIds(
  schemaName: string,
  categoryIds: string[],
): Promise<CatalogItemRow[]> {
  if (categoryIds.length === 0) return listCatalogItems(schemaName);
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  const placeholders = categoryIds.map((_, i) => `$${i + 1}`).join(", ");
  return prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `SELECT id, name, item_type, sku, price_cents, stock_qty, stock_min, category_id, active, created_at, updated_at
     FROM ${table}
     WHERE category_id IN (${placeholders})
     ORDER BY active DESC, name ASC`,
    ...categoryIds,
  );
}

export async function deleteCatalogItem(
  schemaName: string,
  id: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${table} WHERE id = $1`,
    id,
  );
}
