import { getNavItemsForModules } from "@boilerplate/module-registry";
import { ensureModulesRegistered } from "./init";

/** MVP: módulos fixos Fase 1 — depois ler do DB (modulos_ativos) */
const MVP_MODULOS_ATIVOS = [
  "core-catalogo",
  "core-clientes",
  "core-vendas",
  "core-estoque-basico",
  "core-ranking",
  "fiscal-core",
  "fiscal-nfce",
  "fiscal-nfe",
  "fiscal-cte",
  "fiscal-mdfe",
  "fiscal-ciot",
  "fiscal-sped",
  "fiscal-rural",
  "fiscal-contabil",
  "aprendiz",
];

export async function getActiveModuleIds(_organizationId?: string): Promise<string[]> {
  ensureModulesRegistered();
  return MVP_MODULOS_ATIVOS;
}

export async function getDashboardNav(organizationId?: string) {
  const ids = await getActiveModuleIds(organizationId);
  return getNavItemsForModules(ids);
}
