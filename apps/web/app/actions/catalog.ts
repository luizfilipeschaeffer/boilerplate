"use server";

import { auth } from "@/auth";
import {
  createCatalogItem,
  deleteCatalogItem,
  getOrganizationById,
  listCatalogItems,
  type CatalogItemType,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

async function requireOrg() {
  const session = await auth();
  if (!session?.organizationId || session.needsOnboarding) {
    throw new Error("Organização não disponível");
  }
  const org = await getOrganizationById(session.organizationId);
  if (!org) throw new Error("Organização não encontrada");
  return org;
}

export async function listCatalogAction() {
  const org = await requireOrg();
  const rows = await listCatalogItems(org.schemaName);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    itemType: row.item_type as CatalogItemType,
    sku: row.sku,
    priceCents: row.price_cents,
  }));
}

export async function createCatalogAction(data: {
  name: string;
  itemType: CatalogItemType;
  sku?: string | null;
  priceCents?: number | null;
}) {
  const org = await requireOrg();
  await createCatalogItem(org.schemaName, data);
  revalidatePath("/catalogo");
}

export async function deleteCatalogAction(id: string) {
  const org = await requireOrg();
  await deleteCatalogItem(org.schemaName, id);
  revalidatePath("/catalogo");
}
