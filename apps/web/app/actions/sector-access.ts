"use server";

import { recordProvisioningPlatformActivity } from "@boilerplate/db";
import { requireTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

export async function requestSectorAccessAction(sectorSlug: string) {
  const { organizationId, userId } = await requireTenantContext();

  await recordProvisioningPlatformActivity({
    organizationId,
    activityType: "tenant.sector_access_requested",
    body: `Usuário ${userId} solicitou acesso ao setor ${sectorSlug}`,
  });

  revalidatePath("/");
  return { ok: true };
}
