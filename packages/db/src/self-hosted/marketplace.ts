import type { MarketplaceModule } from "@boilerplate/platform-api";
import { prisma } from "../client";

export async function listMarketplaceListings(): Promise<MarketplaceModule[]> {
  const rows = await prisma.marketplaceListing.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.externalId,
    name: r.name,
    description: r.description ?? "",
    type: r.kind as MarketplaceModule["type"],
    ownerDeveloperId: r.ownerDeveloperId ?? undefined,
    status: r.listingStatus as MarketplaceModule["status"],
    pricingModel: r.pricingModel as MarketplaceModule["pricingModel"],
    priceMonthlyCents: r.priceMonthlyCents ?? undefined,
    currentVersion: r.currentVersion,
    minimumPlatformVersion: r.minimumPlatformVersion,
    entitlementsRequired: (r.entitlementsRequired as string[]) ?? [],
    migrations: (r.migrationManifest as unknown as MarketplaceModule["migrations"]) ?? [],
    changelog: (r.changelog as unknown as MarketplaceModule["changelog"]) ?? [],
  }));
}

export async function getMarketplaceListing(
  externalId: string,
): Promise<MarketplaceModule | null> {
  const r = await prisma.marketplaceListing.findUnique({
    where: { externalId },
  });
  if (!r || !r.active) return null;
  return {
    id: r.externalId,
    name: r.name,
    description: r.description ?? "",
    type: r.kind as MarketplaceModule["type"],
    ownerDeveloperId: r.ownerDeveloperId ?? undefined,
    status: r.listingStatus as MarketplaceModule["status"],
    pricingModel: r.pricingModel as MarketplaceModule["pricingModel"],
    priceMonthlyCents: r.priceMonthlyCents ?? undefined,
    currentVersion: r.currentVersion,
    minimumPlatformVersion: r.minimumPlatformVersion,
    entitlementsRequired: (r.entitlementsRequired as string[]) ?? [],
    migrations: (r.migrationManifest as unknown as MarketplaceModule["migrations"]) ?? [],
    changelog: (r.changelog as unknown as MarketplaceModule["changelog"]) ?? [],
  };
}

export async function seedDefaultMarketplaceListings(): Promise<void> {
  const defaults = [
    {
      externalId: "core-crm",
      kind: "module",
      name: "CRM Comercial",
      description: "Pipeline de vendas do tenant",
      listingStatus: "official",
      pricingModel: "subscription",
      priceMonthlyCents: 4900,
      currentVersion: "1.0.0",
      minimumPlatformVersion: "1.0.0",
      entitlementsRequired: ["module:core-crm"],
    },
    {
      externalId: "ops-compras",
      kind: "module",
      name: "Compras",
      description: "Fornecedores e ordens de compra",
      listingStatus: "official",
      pricingModel: "subscription",
      priceMonthlyCents: 3900,
      currentVersion: "1.0.0",
      minimumPlatformVersion: "1.0.0",
      entitlementsRequired: ["module:ops-compras"],
    },
  ];
  for (const d of defaults) {
    await prisma.marketplaceListing.upsert({
      where: { externalId: d.externalId },
      create: {
        ...d,
        entitlementsRequired: d.entitlementsRequired,
        migrationManifest: { moduleId: d.externalId, version: "1.0.0", migrations: [] },
        changelog: [],
      },
      update: {},
    });
  }
}
