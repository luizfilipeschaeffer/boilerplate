import { registerAllModules, getAllModules } from "@boilerplate/module-registry";
import type { ModuleDefinition } from "@boilerplate/shared";
import { prisma } from "./client";
import { getActiveModuleIdsForOrg } from "./organization";

export type RoadmapModuleRow = {
  id: string;
  name: string;
  sectorSlug: string;
  sectorName: string;
  faseMinima: number;
  implementationStatus: string;
  depthCurrent: number;
  depthTarget: number;
  depthTargetMarco: string | null;
  deliveryMarco: string | null;
  progressPct: number;
};

export type RoadmapSectorGroup = {
  slug: string;
  name: string;
  camada: string;
  presenca: string;
  modules: RoadmapModuleRow[];
  sectorProgressPct: number;
};

export type PublicChangelogEntry = {
  id: string;
  moduleId: string;
  moduleName: string;
  title: string;
  publicSummary: string;
  depthFrom: number;
  depthTo: number;
  releasedAt: Date;
};

export type PlatformDepthSummary = {
  platformDepthPct: number;
  moduleCount: number;
  byMarco: Record<string, number>;
  byStatus: Record<string, number>;
};

export type SectorProgressRow = {
  sectorSlug: string;
  sectorName: string;
  progressPct: number;
  moduleCount: number;
};

export type NextImprovementRow = {
  id: string;
  name: string;
  sectorName: string;
  depthCurrent: number;
  depthTarget: number;
  gap: number;
};

function progressPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export async function syncRegistryToCatalog(): Promise<number> {
  registerAllModules();
  const modules = getAllModules();
  let count = 0;

  for (const mod of modules) {
    const sectorSlug = mod.sectorSlug ?? "operacao";
    await prisma.coreSector.upsert({
      where: { slug: sectorSlug },
      create: {
        slug: sectorSlug,
        name: sectorSlug,
        camada: mod.camada ?? "Operacional",
        presenca: "Universal",
        ordem: 99,
      },
      update: {},
    });

    const existing = await prisma.coreModuleCatalog.findUnique({
      where: { id: mod.id },
    });

    await prisma.coreModuleCatalog.upsert({
      where: { id: mod.id },
      create: {
        id: mod.id,
        name: mod.name,
        sectorSlug,
        faseMinima: mod.faseMinima,
        implementationStatus: mod.implementationStatus,
        depthCurrent: mod.depthCurrent ?? 0,
        depthTarget: mod.depthTarget ?? 3,
        depthTargetMarco: mod.depthTargetMarco ?? null,
        deliveryMarco: mod.deliveryMarco ?? null,
        registrySync: true,
      },
      update: {
        name: mod.name,
        sectorSlug,
        faseMinima: mod.faseMinima,
        implementationStatus: mod.implementationStatus,
        depthCurrent: mod.depthCurrent ?? existing?.depthCurrent ?? 0,
        depthTarget: mod.depthTarget ?? existing?.depthTarget ?? 3,
        depthTargetMarco: mod.depthTargetMarco ?? existing?.depthTargetMarco,
        deliveryMarco: mod.deliveryMarco ?? existing?.deliveryMarco,
        registrySync: true,
      },
    });
    count++;
  }

  return count;
}

export async function getRoadmapBySector(): Promise<RoadmapSectorGroup[]> {
  const sectors = await prisma.coreSector.findMany({ orderBy: { ordem: "asc" } });
  const modules = await prisma.coreModuleCatalog.findMany({
    orderBy: [{ sectorSlug: "asc" }, { name: "asc" }],
  });

  const sectorMap = new Map(sectors.map((s) => [s.slug, s]));

  const groups: RoadmapSectorGroup[] = sectors.map((sector) => {
    const sectorModules = modules
      .filter((m) => m.sectorSlug === sector.slug)
      .map((m): RoadmapModuleRow => {
        const s = sectorMap.get(m.sectorSlug)!;
        return {
          id: m.id,
          name: m.name,
          sectorSlug: m.sectorSlug,
          sectorName: s.name,
          faseMinima: m.faseMinima,
          implementationStatus: m.implementationStatus,
          depthCurrent: m.depthCurrent,
          depthTarget: m.depthTarget,
          depthTargetMarco: m.depthTargetMarco,
          deliveryMarco: m.deliveryMarco,
          progressPct: progressPct(m.depthCurrent, m.depthTarget),
        };
      });

    const avg =
      sectorModules.length > 0
        ? Math.round(
            sectorModules.reduce((a, m) => a + m.progressPct, 0) /
              sectorModules.length,
          )
        : 0;

    return {
      slug: sector.slug,
      name: sector.name,
      camada: sector.camada,
      presenca: sector.presenca,
      modules: sectorModules,
      sectorProgressPct: avg,
    };
  });

  return groups.filter((g) => g.modules.length > 0);
}

export async function getPlatformDepthSummary(): Promise<PlatformDepthSummary> {
  const modules = await prisma.coreModuleCatalog.findMany({
    where: { registrySync: true },
  });

  if (modules.length === 0) {
    return {
      platformDepthPct: 0,
      moduleCount: 0,
      byMarco: {},
      byStatus: {},
    };
  }

  const platformDepthPct = Math.round(
    modules.reduce(
      (a, m) => a + progressPct(m.depthCurrent, m.depthTarget),
      0,
    ) / modules.length,
  );

  const byMarco: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const m of modules) {
    const marco = m.deliveryMarco ?? "planejado";
    byMarco[marco] = (byMarco[marco] ?? 0) + 1;
    byStatus[m.implementationStatus] =
      (byStatus[m.implementationStatus] ?? 0) + 1;
  }

  return {
    platformDepthPct,
    moduleCount: modules.length,
    byMarco,
    byStatus,
  };
}

export async function getPublicChangelog(
  limit = 10,
): Promise<PublicChangelogEntry[]> {
  const rows = await prisma.moduleDepthChangelog.findMany({
    where: { showToTenants: true },
    orderBy: { releasedAt: "desc" },
    take: limit,
    include: { module: true },
  });

  return rows.map((r) => ({
    id: r.id,
    moduleId: r.moduleId,
    moduleName: r.module.name,
    title: r.title,
    publicSummary: r.publicSummary,
    depthFrom: r.depthFrom,
    depthTo: r.depthTo,
    releasedAt: r.releasedAt,
  }));
}

export async function getSectorProgressForOrg(
  organizationId: string,
): Promise<SectorProgressRow[]> {
  const activeIds = await getActiveModuleIdsForOrg(organizationId);
  if (activeIds.length === 0) return [];

  const catalog = await prisma.coreModuleCatalog.findMany({
    where: { id: { in: activeIds } },
    include: { sector: true },
  });

  const bySector = new Map<
    string,
    { name: string; pcts: number[]; count: number }
  >();

  for (const m of catalog) {
    const entry = bySector.get(m.sectorSlug) ?? {
      name: m.sector.name,
      pcts: [],
      count: 0,
    };
    entry.pcts.push(progressPct(m.depthCurrent, m.depthTarget));
    entry.count++;
    bySector.set(m.sectorSlug, entry);
  }

  const sectors = await prisma.coreSector.findMany({ orderBy: { ordem: "asc" } });

  return sectors
    .filter((s) => bySector.has(s.slug))
    .map((s) => {
      const data = bySector.get(s.slug)!;
      const progressPctAvg =
        data.pcts.length > 0
          ? Math.round(data.pcts.reduce((a, b) => a + b, 0) / data.pcts.length)
          : 0;
      return {
        sectorSlug: s.slug,
        sectorName: s.name,
        progressPct: progressPctAvg,
        moduleCount: data.count,
      };
    });
}

export async function getNextImprovementsForOrg(
  organizationId: string,
  limit = 8,
): Promise<NextImprovementRow[]> {
  const activeIds = await getActiveModuleIdsForOrg(organizationId);
  if (activeIds.length === 0) return [];

  const catalog = await prisma.coreModuleCatalog.findMany({
    where: { id: { in: activeIds } },
    include: { sector: true },
  });

  return catalog
    .filter((m) => m.depthCurrent < m.depthTarget)
    .map((m) => ({
      id: m.id,
      name: m.name,
      sectorName: m.sector.name,
      depthCurrent: m.depthCurrent,
      depthTarget: m.depthTarget,
      gap: m.depthTarget - m.depthCurrent,
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);
}

export function moduleDefinitionToCatalogFields(mod: ModuleDefinition) {
  return {
    id: mod.id,
    name: mod.name,
    sectorSlug: mod.sectorSlug ?? "operacao",
    faseMinima: mod.faseMinima,
    implementationStatus: mod.implementationStatus,
    depthCurrent: mod.depthCurrent ?? 0,
    depthTarget: mod.depthTarget ?? 3,
    depthTargetMarco: mod.depthTargetMarco ?? null,
    deliveryMarco: mod.deliveryMarco ?? null,
  };
}
