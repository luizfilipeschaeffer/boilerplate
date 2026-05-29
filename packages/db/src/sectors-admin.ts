import { randomUUID } from "node:crypto";
import { prisma } from "./client";

export type SectorVisibilityStatus = "hidden" | "em_breve" | "active";

export interface SectorRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  core_sector_slug: string | null;
  visibility_status: SectorVisibilityStatus;
  is_aggregator: boolean;
  /** Preenchido em listagens com contexto de membro */
  access_state?: "active" | "em_breve" | "hidden" | "request_access";
}

export async function listSectors(
  organizationId: string,
  opts?: { includeHidden?: boolean },
): Promise<SectorRow[]> {
  const rows = await prisma.sector.findMany({
    where: {
      organizationId,
      ...(opts?.includeHidden ? {} : { visibilityStatus: { not: "hidden" } }),
    },
    orderBy: { name: "asc" },
  });
  return rows.map(mapSectorRow);
}

function mapSectorRow(r: {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  coreSectorSlug: string | null;
  visibilityStatus: string;
  isAggregator: boolean;
}): SectorRow {
  return {
    id: r.id,
    organization_id: r.organizationId,
    name: r.name,
    slug: r.slug,
    core_sector_slug: r.coreSectorSlug,
    visibility_status: r.visibilityStatus as SectorVisibilityStatus,
    is_aggregator: r.isAggregator,
  };
}

export async function getSectorBySlug(
  organizationId: string,
  slug: string,
): Promise<SectorRow | null> {
  const row = await prisma.sector.findFirst({
    where: { organizationId, slug },
  });
  if (!row) return null;
  return mapSectorRow(row);
}

export async function createSector(
  organizationId: string,
  input: { name: string; slug?: string; coreSectorSlug?: string | null },
): Promise<SectorRow> {
  const name = input.name.trim();
  if (!name) throw new Error("Nome do setor é obrigatório");
  const slug =
    input.slug?.trim() ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    "setor";

  const row = await prisma.sector.create({
    data: {
      id: randomUUID(),
      organizationId,
      name,
      slug,
      coreSectorSlug: input.coreSectorSlug ?? null,
      visibilityStatus: "active",
      isAggregator: false,
    },
  });

  return mapSectorRow(row);
}

export async function listSectorModuleIds(sectorId: string): Promise<string[]> {
  const rows = await prisma.sectorModule.findMany({
    where: { sectorId },
    select: { moduleId: true },
  });
  return rows.map((r) => r.moduleId);
}

export async function setSectorModules(
  sectorId: string,
  moduleIds: string[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.sectorModule.deleteMany({ where: { sectorId } });
    if (moduleIds.length === 0) return;
    await tx.sectorModule.createMany({
      data: moduleIds.map((moduleId) => ({
        id: randomUUID(),
        sectorId,
        moduleId,
      })),
      skipDuplicates: true,
    });
  });
}

/** Se setor sem módulos explícitos, libera todos os módulos ativos da org. */
export async function resolveModuleIdsForSector(
  organizationId: string,
  sectorSlug: string,
): Promise<string[] | null> {
  const sector = await getSectorBySlug(organizationId, sectorSlug);
  if (!sector) return null;
  const moduleIds = await listSectorModuleIds(sector.id);
  if (moduleIds.length === 0) return null;
  return moduleIds;
}

export async function seedDefaultSectorModules(
  organizationId: string,
  sectorSlug: string,
  moduleIds: string[],
): Promise<void> {
  const sector = await getSectorBySlug(organizationId, sectorSlug);
  if (!sector) return;
  const existing = await listSectorModuleIds(sector.id);
  if (existing.length > 0) return;
  await setSectorModules(sector.id, moduleIds);
}
