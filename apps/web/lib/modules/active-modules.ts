import { getNavItemsForModules } from "@boilerplate/module-registry";
import { getActiveModuleIdsForOrg } from "@boilerplate/db";
import { ensureModulesRegistered } from "./init";

export async function getActiveModuleIds(
  organizationId?: string,
): Promise<string[]> {
  ensureModulesRegistered();
  if (!organizationId) return [];
  const ids = await getActiveModuleIdsForOrg(organizationId);
  return ids.length > 0 ? ids : ["core-catalogo", "core-clientes", "core-vendas"];
}

export async function getDashboardNav(organizationId?: string) {
  const ids = await getActiveModuleIds(organizationId);
  return getNavItemsForModules(ids);
}
