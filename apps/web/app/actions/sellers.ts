"use server";

import { auth } from "@/auth";
import { requireTenantContext } from "@/lib/tenant-context";
import { sellerInviteUrl } from "@/lib/app-url";
import {
  createSeller,
  createSellerInvite,
  listSellers,
  listSellersWithStats,
  setSellerActive,
  updateSeller,
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
  sendInvite?: boolean;
}) {
  const session = await auth();
  const orgId = session?.organizationId;
  if (!orgId) throw new Error("Organização não disponível");
  const { schemaName } = await requireTenantContext();
  const pct = data.commissionPercent
    ? Math.round(parseFloat(data.commissionPercent.replace(",", ".")) * 100)
    : 0;
  const seller = await createSeller(schemaName, {
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    commissionRateBp: Number.isFinite(pct) ? pct : 0,
  });
  const email = data.email?.trim().toLowerCase();
  if (data.sendInvite !== false && email) {
    const { token } = await createSellerInvite({
      organizationId: orgId,
      tenantSellerId: seller.id,
      email,
    });
    const url = sellerInviteUrl(token);
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Convite vendedor ${email}: ${url}`);
    }
  }
  revalidatePath("/vendedores");
}

export async function updateSellerAction(data: {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commissionPercent?: string;
}) {
  const { schemaName } = await requireTenantContext();
  const pct = data.commissionPercent
    ? Math.round(parseFloat(data.commissionPercent.replace(",", ".")) * 100)
    : 0;
  await updateSeller(schemaName, data.id, {
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
