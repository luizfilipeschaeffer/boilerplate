"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  createCatalogItem,
  listCatalogItems,
  setCatalogItemActive,
  updateCatalogItem,
  type CatalogItemType,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listCatalogAction() {
  const { schemaName } = await requireTenantContext();
  const rows = await listCatalogItems(schemaName);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    itemType: row.item_type as CatalogItemType,
    sku: row.sku,
    priceCents: row.price_cents,
    stockQty: row.stock_qty,
    stockMin: row.stock_min,
    categoryId: row.category_id,
    active: row.active,
  }));
}

export async function createCatalogAction(data: {
  name: string;
  itemType: CatalogItemType;
  sku?: string | null;
  priceCents?: number | null;
  categoryId?: string | null;
}) {
  const ctx = await requireTenantContext();
  const row = await createCatalogItem(ctx.schemaName, data);
  await emitAndPersist({
    type: "item.criado",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { itemId: row.id, name: row.name, itemType: row.item_type },
  });
  revalidatePath("/catalogo");
}

export async function updateCatalogAction(
  id: string,
  data: {
    name: string;
    itemType: CatalogItemType;
    sku?: string | null;
    priceCents?: number | null;
    categoryId?: string | null;
  },
) {
  const ctx = await requireTenantContext();
  await updateCatalogItem(ctx.schemaName, id, data);
  revalidatePath("/catalogo");
}

export async function setCatalogItemActiveAction(id: string, active: boolean) {
  const ctx = await requireTenantContext();
  await setCatalogItemActive(ctx.schemaName, id, active);
  revalidatePath("/catalogo");
}
