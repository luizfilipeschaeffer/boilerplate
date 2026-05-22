import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { expandCategoryIds, listCatalogCategories } from "./categories";
import { assertSafeSchemaName } from "./schema";

export interface SupplierRow {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  lead_time_days: number;
  notes: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SupplierCategoryLink {
  supplier_id: string;
  category_id: string;
  is_default: boolean;
}

function suppliersTable(schemaName: string): string {
  return `"${schemaName}"."suppliers"`;
}

function supplierCategoriesTable(schemaName: string): string {
  return `"${schemaName}"."supplier_categories"`;
}

export async function listSuppliers(
  schemaName: string,
): Promise<SupplierRow[]> {
  assertSafeSchemaName(schemaName);
  const table = suppliersTable(schemaName);
  return prisma.$queryRawUnsafe<SupplierRow[]>(
    `SELECT id, name, document, email, phone, lead_time_days, notes, active, created_at, updated_at
     FROM ${table}
     ORDER BY active DESC, name ASC`,
  );
}

export async function getSupplierById(
  schemaName: string,
  id: string,
): Promise<SupplierRow | null> {
  assertSafeSchemaName(schemaName);
  const table = suppliersTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<SupplierRow[]>(
    `SELECT id, name, document, email, phone, lead_time_days, notes, active, created_at, updated_at
     FROM ${table} WHERE id = $1`,
    id,
  );
  return rows[0] ?? null;
}

export async function listSupplierCategoryLinks(
  schemaName: string,
  supplierId: string,
): Promise<SupplierCategoryLink[]> {
  assertSafeSchemaName(schemaName);
  const table = supplierCategoriesTable(schemaName);
  return prisma.$queryRawUnsafe<SupplierCategoryLink[]>(
    `SELECT supplier_id, category_id, is_default
     FROM ${table} WHERE supplier_id = $1`,
    supplierId,
  );
}

export async function createSupplier(
  schemaName: string,
  data: {
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    leadTimeDays?: number;
    notes?: string | null;
    categoryIds?: string[];
    defaultCategoryId?: string | null;
  },
): Promise<SupplierRow> {
  assertSafeSchemaName(schemaName);
  const id = randomUUID();
  const table = suppliersTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<SupplierRow[]>(
    `INSERT INTO ${table} (id, name, document, email, phone, lead_time_days, notes, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING id, name, document, email, phone, lead_time_days, notes, active, created_at, updated_at`,
    id,
    data.name.trim(),
    data.document ?? null,
    data.email ?? null,
    data.phone ?? null,
    data.leadTimeDays ?? 0,
    data.notes ?? null,
  );
  if (data.categoryIds?.length) {
    await setSupplierCategories(schemaName, id, data.categoryIds, data.defaultCategoryId);
  }
  return rows[0]!;
}

export async function updateSupplier(
  schemaName: string,
  id: string,
  data: {
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    leadTimeDays?: number;
    notes?: string | null;
    active?: boolean;
    categoryIds?: string[];
    defaultCategoryId?: string | null;
  },
): Promise<SupplierRow> {
  assertSafeSchemaName(schemaName);
  const table = suppliersTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<SupplierRow[]>(
    `UPDATE ${table}
     SET name = $2,
         document = $3,
         email = $4,
         phone = $5,
         lead_time_days = $6,
         notes = $7,
         active = COALESCE($8, active),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, document, email, phone, lead_time_days, notes, active, created_at, updated_at`,
    id,
    data.name.trim(),
    data.document ?? null,
    data.email ?? null,
    data.phone ?? null,
    data.leadTimeDays ?? 0,
    data.notes ?? null,
    data.active ?? null,
  );
  if (!rows[0]) throw new Error("Fornecedor não encontrado");
  if (data.categoryIds !== undefined) {
    await setSupplierCategories(schemaName, id, data.categoryIds, data.defaultCategoryId);
  }
  return rows[0];
}

async function setSupplierCategories(
  schemaName: string,
  supplierId: string,
  categoryIds: string[],
  defaultCategoryId?: string | null,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = supplierCategoriesTable(schemaName);
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${table} WHERE supplier_id = $1`,
    supplierId,
  );
  const unique = [...new Set(categoryIds)];
  for (const categoryId of unique) {
    const isDefault = defaultCategoryId === categoryId;
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${table} (supplier_id, category_id, is_default)
       VALUES ($1, $2, $3)`,
      supplierId,
      categoryId,
      isDefault,
    );
  }
}

/** Resolve fornecedor para um item pela categoria (com herança de categoria pai). */
export async function resolveSupplierForCategory(
  schemaName: string,
  categoryId: string | null,
): Promise<string | null> {
  if (!categoryId) return null;
  assertSafeSchemaName(schemaName);
  const categories = await listCatalogCategories(schemaName);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const cat = byId.get(categoryId);
  if (!cat) return null;

  const candidateIds: string[] = [categoryId];
  if (cat.parent_id) {
    candidateIds.push(cat.parent_id);
  }

  const linkTable = supplierCategoriesTable(schemaName);
  for (const cid of candidateIds) {
    const links = await prisma.$queryRawUnsafe<
      { supplier_id: string; is_default: boolean }[]
    >(
      `SELECT supplier_id, is_default FROM ${linkTable} WHERE category_id = $1`,
      cid,
    );
    if (links.length === 0) continue;
    const preferred = links.find((l) => l.is_default);
    return (preferred ?? links[0])!.supplier_id;
  }
  return null;
}

/** Categoria IDs efetivamente abastecidas por um fornecedor (links diretos + filhos de pais). */
export async function getSupplierEffectiveCategoryIds(
  schemaName: string,
  supplierId: string,
): Promise<string[]> {
  const links = await listSupplierCategoryLinks(schemaName, supplierId);
  const effective = new Set<string>();
  for (const link of links) {
    const expanded = await expandCategoryIds(schemaName, link.category_id);
    for (const id of expanded) effective.add(id);
  }
  return [...effective];
}
