"use server";

import { requireTenantContext } from "@/lib/tenant-context";
import {
  createCatalogCategory,
  deleteCatalogCategory,
  expandCategoryIds,
  listCatalogCategories,
  updateCatalogCategory,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export type CategoryDto = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

function mapCategory(row: {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
}): CategoryDto {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    active: row.active,
  };
}

export async function listCategoriesAction(): Promise<CategoryDto[]> {
  const { schemaName } = await requireTenantContext();
  const rows = await listCatalogCategories(schemaName);
  return rows.map(mapCategory);
}

export async function createCategoryAction(data: {
  name: string;
  parentId?: string | null;
}) {
  const { schemaName } = await requireTenantContext();
  await createCatalogCategory(schemaName, {
    name: data.name,
    parentId: data.parentId ?? null,
  });
  revalidatePath("/catalogo");
}

export async function updateCategoryAction(
  id: string,
  data: { name: string; active?: boolean },
) {
  const { schemaName } = await requireTenantContext();
  await updateCatalogCategory(schemaName, id, data);
  revalidatePath("/catalogo");
}

export async function deleteCategoryAction(id: string) {
  const { schemaName } = await requireTenantContext();
  await deleteCatalogCategory(schemaName, id);
  revalidatePath("/catalogo");
}

export async function expandCategoryIdsAction(
  categoryId: string,
): Promise<string[]> {
  const { schemaName } = await requireTenantContext();
  return expandCategoryIds(schemaName, categoryId);
}
