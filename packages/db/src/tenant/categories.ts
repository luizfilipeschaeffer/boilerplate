import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { assertSafeSchemaName } from "./schema";

export interface CatalogCategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

function categoriesTable(schemaName: string): string {
  return `"${schemaName}"."catalog_categories"`;
}

export async function listCatalogCategories(
  schemaName: string,
): Promise<CatalogCategoryRow[]> {
  assertSafeSchemaName(schemaName);
  const table = categoriesTable(schemaName);
  return prisma.$queryRawUnsafe<CatalogCategoryRow[]>(
    `SELECT id, parent_id, name, slug, sort_order, active, created_at, updated_at
     FROM ${table}
     ORDER BY sort_order ASC, name ASC`,
  );
}

export async function getCatalogCategoryById(
  schemaName: string,
  id: string,
): Promise<CatalogCategoryRow | null> {
  assertSafeSchemaName(schemaName);
  const table = categoriesTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogCategoryRow[]>(
    `SELECT id, parent_id, name, slug, sort_order, active, created_at, updated_at
     FROM ${table} WHERE id = $1`,
    id,
  );
  return rows[0] ?? null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "categoria";
}

export async function createCatalogCategory(
  schemaName: string,
  data: { name: string; parentId?: string | null; sortOrder?: number },
): Promise<CatalogCategoryRow> {
  assertSafeSchemaName(schemaName);
  if (data.parentId) {
    const parent = await getCatalogCategoryById(schemaName, data.parentId);
    if (!parent) throw new Error("Categoria pai não encontrada.");
    if (parent.parent_id) {
      throw new Error("Subcategoria não pode ter filhos (máximo 2 níveis).");
    }
  }
  const id = randomUUID();
  const table = categoriesTable(schemaName);
  const slug = `${slugify(data.name)}-${id.slice(0, 8)}`;
  const rows = await prisma.$queryRawUnsafe<CatalogCategoryRow[]>(
    `INSERT INTO ${table} (id, parent_id, name, slug, sort_order, active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, parent_id, name, slug, sort_order, active, created_at, updated_at`,
    id,
    data.parentId ?? null,
    data.name.trim(),
    slug,
    data.sortOrder ?? 0,
  );
  return rows[0]!;
}

export async function updateCatalogCategory(
  schemaName: string,
  id: string,
  data: { name: string; sortOrder?: number; active?: boolean },
): Promise<CatalogCategoryRow> {
  assertSafeSchemaName(schemaName);
  const table = categoriesTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<CatalogCategoryRow[]>(
    `UPDATE ${table}
     SET name = $2,
         sort_order = COALESCE($3, sort_order),
         active = COALESCE($4, active),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, parent_id, name, slug, sort_order, active, created_at, updated_at`,
    id,
    data.name.trim(),
    data.sortOrder ?? null,
    data.active ?? null,
  );
  if (!rows[0]) throw new Error("Categoria não encontrada");
  return rows[0];
}

export async function deleteCatalogCategory(
  schemaName: string,
  id: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = categoriesTable(schemaName);
  const cat = await getCatalogCategoryById(schemaName, id);
  if (!cat) throw new Error("Categoria não encontrada");
  const children = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${table} WHERE parent_id = $1 LIMIT 1`,
    id,
  );
  if (children.length > 0) {
    throw new Error("Remova as subcategorias antes de excluir esta categoria.");
  }
  const itemsTable = `"${schemaName}"."catalog_items"`;
  await prisma.$executeRawUnsafe(
    `UPDATE ${itemsTable} SET category_id = NULL, updated_at = NOW() WHERE category_id = $1`,
    id,
  );
  await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE id = $1`, id);
}

/** IDs da categoria e de todas as subcategorias filhas. */
export async function expandCategoryIds(
  schemaName: string,
  categoryId: string,
): Promise<string[]> {
  assertSafeSchemaName(schemaName);
  const cat = await getCatalogCategoryById(schemaName, categoryId);
  if (!cat) return [];
  const table = categoriesTable(schemaName);
  if (cat.parent_id) return [categoryId];
  const children = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${table} WHERE parent_id = $1 AND active = true`,
    categoryId,
  );
  return [categoryId, ...children.map((c) => c.id)];
}
