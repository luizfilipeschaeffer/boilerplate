"use server";

import {
  createSector,
  listSectors,
  listSectorModuleIds,
  setSectorModules,
  getActiveModuleIdsForOrg,
} from "@boilerplate/db";
import { requireTenantContext } from "@/lib/tenant-context";
import { getModulesByIds } from "@boilerplate/module-registry";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { revalidatePath } from "next/cache";

async function requireOrgId() {
  const { organizationId } = await requireTenantContext();
  return organizationId;
}

export async function listSectorsConfigAction() {
  const orgId = await requireOrgId();
  const sectors = await listSectors(orgId);
  const orgModules = await getActiveModuleIdsForOrg(orgId);
  const withModules = await Promise.all(
    sectors.map(async (s) => ({
      ...s,
      moduleIds: await listSectorModuleIds(s.id),
    })),
  );
  ensureModulesRegistered();
  const defs = getModulesByIds(orgModules);
  const orgModuleOptions = orgModules.map((id) => {
    const def = defs.find((d) => d.id === id);
    return { id, name: def?.name ?? id };
  });
  return {
    sectors: withModules,
    orgModuleIds: orgModules,
    orgModuleOptions,
  };
}

export async function createSectorAction(data: {
  name: string;
  coreSectorSlug?: string | null;
}) {
  const orgId = await requireOrgId();
  await createSector(orgId, {
    name: data.name,
    coreSectorSlug: data.coreSectorSlug ?? null,
  });
  revalidatePath("/configuracoes/setores");
}

export async function setSectorModulesAction(
  sectorId: string,
  moduleIds: string[],
) {
  await requireOrgId();
  await setSectorModules(sectorId, moduleIds);
  revalidatePath("/configuracoes/setores");
}

