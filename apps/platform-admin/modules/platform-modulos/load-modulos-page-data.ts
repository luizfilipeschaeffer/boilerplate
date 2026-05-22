import {
  getModuloAtivacaoCounts,
  listBundlePrecos,
  listModuloPrecos,
  listPlanosBase,
  seedDefaultPricingIfEmpty,
  type PlatformRole,
} from "@boilerplate/db";
import { getAllModules, registerAllModules } from "@boilerplate/module-registry";
import { cache } from "react";
import { auth } from "@/auth";
import { canEditModulosPricing } from "./can-edit-modulos";

async function ensureModulosPricingReady() {
  await seedDefaultPricingIfEmpty();
  registerAllModules();
}

export const loadModulosAccess = cache(async () => {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  return canEditModulosPricing(role);
});

export const loadModulosCatalogoData = cache(async () => {
  await ensureModulosPricingReady();
  const [modules, precos, canEdit] = await Promise.all([
    Promise.resolve(getAllModules()),
    listModuloPrecos(),
    loadModulosAccess(),
  ]);
  return {
    modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
    precos,
    canEdit,
  };
});

export const loadModulosPlanosData = cache(async () => {
  await ensureModulosPricingReady();
  const [modules, planos, canEdit] = await Promise.all([
    Promise.resolve(getAllModules()),
    listPlanosBase(),
    loadModulosAccess(),
  ]);
  return {
    modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
    planos,
    canEdit,
  };
});

export const loadModulosBundlesData = cache(async () => {
  await ensureModulosPricingReady();
  const [modules, bundles, canEdit] = await Promise.all([
    Promise.resolve(getAllModules()),
    listBundlePrecos(),
    loadModulosAccess(),
  ]);
  return {
    modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
    bundles,
    canEdit,
  };
});

export const loadModulosAtivacoesData = cache(async () => {
  await ensureModulosPricingReady();
  const [ativacoes, canEdit] = await Promise.all([
    getModuloAtivacaoCounts(),
    loadModulosAccess(),
  ]);
  return { ativacoes, canEdit };
});
