import platformCatalogSeed from "../data/platform-catalog.json";
import { prisma } from "./client";
import {
  upsertBundlePreco,
  upsertModuloPreco,
  upsertPlanoBase,
} from "./billing-pricing";
import type { BundlePrecoRow, ModuloPrecoRow, PlanoBaseRow } from "./billing-pricing";
import type {
  PlatformCatalogIntegratorSeed,
  PlatformIntegratorCatalogRow,
  IntegratorImplementationStatus,
} from "./platform-integrators.types";

export type PlatformCatalogJson = {
  integrators: PlatformCatalogIntegratorSeed[];
  moduloPrecos?: ModuloPrecoRow[];
  planos?: PlanoBaseRow[];
  bundles?: BundlePrecoRow[];
};

export type {
  IntegratorImplementationStatus,
  PlatformCatalogGatewaySeed,
  PlatformCatalogIntegratorSeed,
  PlatformIntegratorCatalogRow,
} from "./platform-integrators.types";

function parseStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

function mapCatalogRow(s: {
  id: string;
  label: string;
  tipo: string;
  provider: string | null;
  description: string | null;
  implementationStatus: string;
  modulosSuportados: unknown;
  packagePath: string | null;
  deliveryMarco: string | null;
  ordem: number;
}): PlatformIntegratorCatalogRow {
  return {
    id: s.id,
    label: s.label,
    tipo: s.tipo,
    provider: s.provider,
    description: s.description,
    implementationStatus: s.implementationStatus as IntegratorImplementationStatus,
    modulosSuportados: parseStringArray(s.modulosSuportados),
    packagePath: s.packagePath,
    deliveryMarco: s.deliveryMarco,
    ordem: s.ordem,
  };
}

export function loadPlatformCatalogJson(): PlatformCatalogJson {
  return platformCatalogSeed as PlatformCatalogJson;
}

export async function listPlatformIntegratorCatalog(opts?: {
  tipo?: string;
}): Promise<PlatformIntegratorCatalogRow[]> {
  const rows = await prisma.platformIntegratorCatalog.findMany({
    where: opts?.tipo ? { tipo: opts.tipo } : undefined,
    orderBy: [{ ordem: "asc" }, { label: "asc" }],
  });
  return rows.map(mapCatalogRow);
}

export async function seedPlatformIntegratorCatalog(
  items: PlatformCatalogIntegratorSeed[],
): Promise<number> {
  for (const item of items) {
    await prisma.platformIntegratorCatalog.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        label: item.label,
        tipo: item.tipo,
        provider: item.provider ?? null,
        description: item.description ?? null,
        implementationStatus: item.implementationStatus,
        modulosSuportados: item.modulosSuportados ?? [],
        packagePath: item.packagePath ?? null,
        deliveryMarco: item.deliveryMarco ?? null,
        ordem: item.ordem ?? 0,
      },
      update: {
        label: item.label,
        tipo: item.tipo,
        provider: item.provider ?? null,
        description: item.description ?? null,
        implementationStatus: item.implementationStatus,
        modulosSuportados: item.modulosSuportados ?? [],
        packagePath: item.packagePath ?? null,
        deliveryMarco: item.deliveryMarco ?? null,
        ordem: item.ordem ?? 0,
      },
    });
  }
  return items.length;
}

export async function seedPaymentGatewaysFromCatalog(
  items: PlatformCatalogIntegratorSeed[],
): Promise<number> {
  let count = 0;
  for (const item of items) {
    if (item.tipo !== "payment" || !item.gateway) continue;
    const configSchema = (item.gateway.configSchema ?? {}) as object;
    await prisma.platformPaymentGateway.upsert({
      where: { integratorId: item.id },
      create: {
        integratorId: item.id,
        label: item.label,
        isDefault: item.gateway.isDefault ?? false,
        configSchema,
        ativo: item.gateway.ativo ?? true,
      },
      update: {
        label: item.label,
        isDefault: item.gateway.isDefault,
        configSchema,
        ativo: item.gateway.ativo,
      },
    });
    count += 1;
  }
  return count;
}

export async function seedPricingFromCatalog(catalog: PlatformCatalogJson): Promise<{
  moduloPrecos: number;
  planos: number;
  bundles: number;
}> {
  let moduloPrecos = 0;
  let planos = 0;
  let bundles = 0;

  for (const row of catalog.moduloPrecos ?? []) {
    await upsertModuloPreco(row);
    moduloPrecos += 1;
  }
  for (const row of catalog.planos ?? []) {
    await upsertPlanoBase(row);
    planos += 1;
  }
  for (const row of catalog.bundles ?? []) {
    await upsertBundlePreco(row);
    bundles += 1;
  }

  return { moduloPrecos, planos, bundles };
}

/** Catálogo de integradores, gateways de pagamento e tabela de preços (JSON). */
export async function seedPlatformCatalogFromJson(): Promise<{
  integrators: number;
  gateways: number;
  moduloPrecos: number;
  planos: number;
  bundles: number;
}> {
  const catalog = loadPlatformCatalogJson();
  const integrators = await seedPlatformIntegratorCatalog(catalog.integrators);
  const gateways = await seedPaymentGatewaysFromCatalog(catalog.integrators);
  const pricing = await seedPricingFromCatalog(catalog);
  return { integrators, gateways, ...pricing };
}
