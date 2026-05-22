import { getNavItemsForModules } from "@boilerplate/module-registry";
import {
  getActiveModuleIdsForOrg,
  resolveModuleIdsForSector,
  resolveModuleIdsForMembershipSector,
} from "@boilerplate/db";
import { filterNavModuleIdsForRole } from "@/lib/rbac";
import { ensureModulesRegistered } from "./init";

export async function getActiveModuleIds(
  organizationId?: string,
  sectorSlug?: string,
  role?: string,
  userId?: string,
): Promise<string[]> {
  ensureModulesRegistered();
  if (!organizationId) return [];
  let ids = await getActiveModuleIdsForOrg(organizationId);
  if (ids.length === 0) {
    ids = ["core-catalogo", "core-clientes", "core-vendas"];
  }
  if (sectorSlug) {
    let sectorSubset: string[] | null = null;
    if (userId) {
      sectorSubset = await resolveModuleIdsForMembershipSector(
        userId,
        organizationId,
        sectorSlug,
      );
    }
    if (sectorSubset === null) {
      sectorSubset = await resolveModuleIdsForSector(
        organizationId,
        sectorSlug,
      );
    }
    if (sectorSubset?.length) {
      ids = ids.filter((id) => sectorSubset!.includes(id));
    }
  }
  if (role) {
    ids = filterNavModuleIdsForRole(role, ids);
  }
  return ids;
}

const EVOLUCAO_NAV_ITEM = {
  id: "evolucao-nav",
  label: "Evolução",
  href: "/evolucao",
  ordem: 65,
} as const;

export async function getDashboardNav(
  organizationId?: string,
  sectorSlug?: string,
  role?: string,
  userId?: string,
) {
  const ids = await getActiveModuleIds(
    organizationId,
    sectorSlug,
    role,
    userId,
  );
  const items = getNavItemsForModules(ids);
  const hasEvolucao = items.some((i) => i.href === "/evolucao");
  if (hasEvolucao) return items;
  return [...items, EVOLUCAO_NAV_ITEM].sort((a, b) => a.ordem - b.ordem);
}
