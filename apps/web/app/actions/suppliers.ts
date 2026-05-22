"use server";

import { assertComprasPermission } from "@/lib/compras-access";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  createSupplier,
  getSupplierById,
  listCatalogCategories,
  listSupplierCategoryLinks,
  listSuppliers,
  updateSupplier,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export type SupplierDto = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  leadTimeDays: number;
  notes: string | null;
  active: boolean;
  categoryIds: string[];
  defaultCategoryId: string | null;
};

async function toSupplierDto(
  schemaName: string,
  row: Awaited<ReturnType<typeof getSupplierById>>,
): Promise<SupplierDto | null> {
  if (!row) return null;
  const links = await listSupplierCategoryLinks(schemaName, row.id);
  const defaultLink = links.find((l) => l.is_default);
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    email: row.email,
    phone: row.phone,
    leadTimeDays: row.lead_time_days,
    notes: row.notes,
    active: row.active,
    categoryIds: links.map((l) => l.category_id),
    defaultCategoryId: defaultLink?.category_id ?? null,
  };
}

export async function listSuppliersAction(): Promise<SupplierDto[]> {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "ver");
  const rows = await listSuppliers(ctx.schemaName);
  const result: SupplierDto[] = [];
  for (const row of rows) {
    const dto = await toSupplierDto(ctx.schemaName, row);
    if (dto) result.push(dto);
  }
  return result;
}

export async function getSupplierAction(id: string): Promise<SupplierDto | null> {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "ver");
  const row = await getSupplierById(ctx.schemaName, id);
  return toSupplierDto(ctx.schemaName, row);
}

export async function listCategoriesForSupplierFormAction() {
  const { schemaName } = await requireTenantContext();
  const cats = await listCatalogCategories(schemaName);
  return cats
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      parentId: c.parent_id,
      name: c.name,
      isSub: Boolean(c.parent_id),
    }));
}

export async function createSupplierAction(data: {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  leadTimeDays?: number;
  notes?: string | null;
  categoryIds: string[];
  defaultCategoryId?: string | null;
}) {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "registrar");
  await createSupplier(ctx.schemaName, {
    name: data.name,
    document: data.document,
    email: data.email,
    phone: data.phone,
    leadTimeDays: data.leadTimeDays,
    notes: data.notes,
    categoryIds: data.categoryIds,
    defaultCategoryId: data.defaultCategoryId,
  });
  revalidatePath("/compras");
  revalidatePath("/compras/fornecedores");
}

export async function updateSupplierAction(
  id: string,
  data: {
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    leadTimeDays?: number;
    notes?: string | null;
    active?: boolean;
    categoryIds: string[];
    defaultCategoryId?: string | null;
  },
) {
  const ctx = await requireTenantContext();
  assertComprasPermission(ctx.role, "editar");
  await updateSupplier(ctx.schemaName, id, {
    name: data.name,
    document: data.document,
    email: data.email,
    phone: data.phone,
    leadTimeDays: data.leadTimeDays,
    notes: data.notes,
    active: data.active,
    categoryIds: data.categoryIds,
    defaultCategoryId: data.defaultCategoryId,
  });
  revalidatePath("/compras");
  revalidatePath("/compras/fornecedores");
}
