"use server";

import { requireTenantContext } from "@/lib/tenant-context";
import {
  createSeller,
  listSellers,
  listSellersWithStats,
  setSellerActive,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function listSellersAction() {
  const { schemaName } = await requireTenantContext();
  return listSellersWithStats(schemaName);
}

export async function listSellersSimpleAction() {
  const { schemaName } = await requireTenantContext();
  const rows = await listSellers(schemaName);
  return rows.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }));
}

export async function createSellerAction(data: {
  name: string;
  email?: string;
  phone?: string;
  commissionPercent?: string;
}) {
  const { schemaName } = await requireTenantContext();
  const pct = data.commissionPercent
    ? Math.round(parseFloat(data.commissionPercent.replace(",", ".")) * 100)
    : 0;
  await createSeller(schemaName, {
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    commissionRateBp: Number.isFinite(pct) ? pct : 0,
  });
  revalidatePath("/vendedores");
}

export async function setSellerActiveAction(id: string, active: boolean) {
  const { schemaName } = await requireTenantContext();
  await setSellerActive(schemaName, id, active);
  revalidatePath("/vendedores");
}
