import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadMonorepoEnv } from "./load-monorepo-env";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/product-roadmap.json");

type RoadmapJson = {
  sectors: {
    slug: string;
    name: string;
    camada: string;
    presenca: string;
    ordem: number;
  }[];
  modules: {
    id: string;
    name: string;
    sectorSlug: string;
    faseMinima: number;
    implementationStatus: string;
    depthCurrent: number;
    depthTarget: number;
    depthTargetMarco: string | null;
    deliveryMarco: string | null;
  }[];
  segments: {
    slug: string;
    name: string;
    vitalModules: string[];
  }[];
  changelog: {
    moduleId: string;
    title: string;
    publicSummary: string;
    depthFrom: number;
    depthTo: number;
    deliveryMarco: string | null;
    showToTenants: boolean;
    releasedAt: string;
  }[];
};

const MARKET_SECTOR_MAP: Record<string, string> = {
  ERP: "operacao",
  PDV: "comercial",
  CRM: "comercial",
  Financeiro: "financeiro",
  Fiscal: "fiscal",
  Estoque: "operacao",
  BI: "analytics",
  "BI / Analytics": "analytics",
  Analytics: "analytics",
  RH: "pessoas",
  Logística: "logistica",
  Compliance: "compliance",
  Automação: "tecnologia",
  "Atendimento / Suporte": "atendimento",
  Atendimento: "atendimento",
  Suporte: "atendimento",
};

function mapVitalToSector(label: string): string {
  return MARKET_SECTOR_MAP[label] ?? "operacao";
}

if (process.env.VERCEL === "1") {
  console.error(
    "[seed-roadmap] Seeds não podem rodar no build Vercel. Use: bun run db:setup-remote",
  );
  process.exit(1);
}

const loaded = loadMonorepoEnv();
if (loaded.length > 0) {
  console.log(`[seed-roadmap] env: ${loaded.join(" → ")}`);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ausente.");
  process.exit(1);
}

const raw = readFileSync(DATA_PATH, "utf-8");
const data = JSON.parse(raw) as RoadmapJson;

const { prisma } = await import("../src/client");
const { syncRegistryToCatalog } = await import("../src/product-roadmap");
const { seedSegmentSectorTemplatesFromJson } = await import(
  "../src/sector-provisioning"
);

console.log("[seed-roadmap] Setores core…");
for (const s of data.sectors) {
  await prisma.coreSector.upsert({
    where: { slug: s.slug },
    create: s,
    update: {
      name: s.name,
      camada: s.camada,
      presenca: s.presenca,
      ordem: s.ordem,
    },
  });
}

console.log("[seed-roadmap] Catálogo de módulos…");
for (const m of data.modules) {
  await prisma.coreModuleCatalog.upsert({
    where: { id: m.id },
    create: {
      ...m,
      registrySync: true,
    },
    update: {
      name: m.name,
      sectorSlug: m.sectorSlug,
      faseMinima: m.faseMinima,
      implementationStatus: m.implementationStatus,
      depthCurrent: m.depthCurrent,
      depthTarget: m.depthTarget,
      depthTargetMarco: m.depthTargetMarco,
      deliveryMarco: m.deliveryMarco,
      registrySync: true,
    },
  });
}

console.log("[seed-roadmap] Segmentos de mercado…");
let ordem = 0;
for (const seg of data.segments) {
  ordem += 10;
  await prisma.marketSegment.upsert({
    where: { slug: seg.slug },
    create: {
      slug: seg.slug,
      name: seg.name,
      ordem,
      ativo: true,
      tipoNegocioSugeridos: [],
    },
    update: { name: seg.name, ordem, ativo: true },
  });

  for (const vital of seg.vitalModules) {
    const sectorSlug = mapVitalToSector(vital);
    await prisma.segmentVitalModule.upsert({
      where: {
        segmentSlug_vitalModuleLabel: {
          segmentSlug: seg.slug,
          vitalModuleLabel: vital,
        },
      },
      create: {
        segmentSlug: seg.slug,
        vitalModuleLabel: vital,
      },
      update: {},
    });

    await prisma.segmentSectorModule.upsert({
      where: {
        segmentSlug_sectorSlug_marketModuleLabel: {
          segmentSlug: seg.slug,
          sectorSlug,
          marketModuleLabel: vital,
        },
      },
      create: {
        segmentSlug: seg.slug,
        sectorSlug,
        marketModuleLabel: vital,
      },
      update: {},
    });
  }
}

console.log("[seed-roadmap] Changelog de profundidade…");
for (const c of data.changelog) {
  const existing = await prisma.moduleDepthChangelog.findFirst({
    where: {
      moduleId: c.moduleId,
      title: c.title,
    },
  });

  if (existing) {
    await prisma.moduleDepthChangelog.update({
      where: { id: existing.id },
      data: {
        publicSummary: c.publicSummary,
        depthFrom: c.depthFrom,
        depthTo: c.depthTo,
        deliveryMarco: c.deliveryMarco,
        showToTenants: c.showToTenants,
        releasedAt: new Date(c.releasedAt),
      },
    });
  } else {
    await prisma.moduleDepthChangelog.create({
      data: {
        moduleId: c.moduleId,
        title: c.title,
        publicSummary: c.publicSummary,
        depthFrom: c.depthFrom,
        depthTo: c.depthTo,
        deliveryMarco: c.deliveryMarco,
        showToTenants: c.showToTenants,
        releasedAt: new Date(c.releasedAt),
      },
    });
  }
}

const synced = await syncRegistryToCatalog();

const { seedAllSegmentPhaseConfigs } = await import("../src/segment-phases");
const { seedPlatformCatalogFromJson } = await import("../src/platform-integrators");
const phaseConfigs = await seedAllSegmentPhaseConfigs();
const catalog = await seedPlatformCatalogFromJson();
const sectorTemplates = await seedSegmentSectorTemplatesFromJson();

console.log(
  `[seed-roadmap] OK — ${data.sectors.length} setores, ${data.modules.length} módulos, ${data.segments.length} segmentos, ${phaseConfigs} configs fase, ${sectorTemplates.sectors} templates setor, ${sectorTemplates.modules} templates módulo, ${catalog.integrators} integradores, ${catalog.gateways} gateways, ${catalog.planos} planos, ${catalog.bundles} bundles, sync registry: ${synced}`,
);

await prisma.$disconnect();
