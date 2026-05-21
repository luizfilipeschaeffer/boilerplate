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
  created_at: Date;
  updated_at: Date;
}

export async function listCatalogItems(
  schemaName: string,
): Promise<CatalogItemRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantCatalogTable(schemaName);
  return prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `SELECT id, name, item_type, sku, price_cents, created_at, updated_at
     FROM ${table}
     ORDER BY created_at DESC`,
  );
}

export async function createCatalogItem(
  schemaName: string,
  data: {
    name: string;
    itemType: CatalogItemType;
    sku?: string | null;
    priceCents?: number | null;
  },
): Promise<CatalogItemRow> {
  assertSafeSchemaName(schemaName);
  const id = randomUUID();
  const table = tenantCatalogTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogItemRow[]>(
    `INSERT INTO ${table} (id, name, item_type, sku, price_cents)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, item_type, sku, price_cents, created_at, updated_at`,
    id,
    data.name,
    data.itemType,
    data.sku ?? null,
    data.priceCents ?? null,
  );
  return rows[0]!;
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
