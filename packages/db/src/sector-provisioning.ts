import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { Fase } from "@boilerplate/shared";
import { prisma, type Prisma } from "./client";
import { setSectorModules } from "./sectors-admin";
import { recordProvisioningPlatformActivity } from "./provisioning-events";

export type SectorVisibility = "hidden" | "em_breve" | "active";

export type SegmentSectorTemplateRow = {
  segmentSlug: string;
  phaseMin: number;
  coreSectorSlug: string;
  displayName: string;
  sectorSlug: string;
  visibilityDefault: SectorVisibility;
  isAggregator: boolean;
  ordem: number;
};

export type SegmentSectorModuleTemplateRow = {
  segmentSlug: string;
  coreSectorSlug: string;
  moduleId: string;
  phaseMin: number;
  shortcutCoreSectorSlugs: string[];
};

export type ModuleShortcut = {
  moduleId: string;
  primarySectorSlug: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_PATH = join(__dirname, "../data/segment-sector-templates.json");

type TemplatesJson = {
  sectorTemplates: SegmentSectorTemplateRow[];
  moduleTemplates: SegmentSectorModuleTemplateRow[];
  fallbackSegmentSlug: string;
};

let cachedTemplates: TemplatesJson | null = null;

function loadTemplatesJson(): TemplatesJson {
  if (!cachedTemplates) {
    cachedTemplates = JSON.parse(
      readFileSync(TEMPLATES_PATH, "utf-8"),
    ) as TemplatesJson;
  }
  return cachedTemplates;
}

export function resolveSegmentSlugForProvisioning(
  marketSegmentSlug: string | null | undefined,
): string {
  const slug = marketSegmentSlug?.trim() || "varejo";
  const { sectorTemplates, fallbackSegmentSlug } = loadTemplatesJson();
  const hasTemplate = sectorTemplates.some((t) => t.segmentSlug === slug);
  if (hasTemplate) return slug;
  const segment = sectorTemplates.some((t) => t.segmentSlug === fallbackSegmentSlug)
    ? fallbackSegmentSlug
    : "varejo";
  return segment;
}

export async function listSegmentSectorTemplates(
  segmentSlug: string,
): Promise<SegmentSectorTemplateRow[]> {
  const rows = await prisma.segmentSectorTemplate.findMany({
    where: { segmentSlug },
    orderBy: [{ phaseMin: "asc" }, { ordem: "asc" }],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      segmentSlug: r.segmentSlug,
      phaseMin: r.phaseMin,
      coreSectorSlug: r.coreSectorSlug,
      displayName: r.displayName,
      sectorSlug: r.sectorSlug,
      visibilityDefault: r.visibilityDefault as SectorVisibility,
      isAggregator: r.isAggregator,
      ordem: r.ordem,
    }));
  }
  const json = loadTemplatesJson();
  return json.sectorTemplates
    .filter((t) => t.segmentSlug === segmentSlug)
    .sort((a, b) => a.phaseMin - b.phaseMin || a.ordem - b.ordem);
}

export async function listSegmentSectorModuleTemplates(
  segmentSlug: string,
): Promise<SegmentSectorModuleTemplateRow[]> {
  const rows = await prisma.segmentSectorModuleTemplate.findMany({
    where: { segmentSlug },
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      segmentSlug: r.segmentSlug,
      coreSectorSlug: r.coreSectorSlug,
      moduleId: r.moduleId,
      phaseMin: r.phaseMin,
      shortcutCoreSectorSlugs: parseShortcutSlugs(r.shortcutCoreSectorSlugs),
    }));
  }
  const json = loadTemplatesJson();
  return json.moduleTemplates.filter((t) => t.segmentSlug === segmentSlug);
}

function parseShortcutSlugs(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

function resolveVisibilityForPhase(
  template: SegmentSectorTemplateRow,
  currentPhase: number,
): SectorVisibility {
  if (template.phaseMin > currentPhase) return "hidden";
  if (template.visibilityDefault === "hidden" && template.phaseMin <= currentPhase) {
    return "active";
  }
  return template.visibilityDefault;
}

export interface ProvisionSectorsInput {
  organizationId: string;
  marketSegmentSlug: string;
  phase: Fase;
  branchId?: string | null;
  ownerMembershipId?: string;
}

export interface ProvisionSectorsResult {
  sectorIdsBySlug: Record<string, string>;
  created: string[];
  updated: string[];
}

/** Provisiona setores tenant da fase ≤ phase (declaredPhase no signup). */
export async function provisionSectorsForPhase(
  input: ProvisionSectorsInput,
  tx?: Prisma.TransactionClient,
): Promise<ProvisionSectorsResult> {
  const segmentSlug = resolveSegmentSlugForProvisioning(input.marketSegmentSlug);
  const templates = await listSegmentSectorTemplates(segmentSlug);
  const applicable = templates.filter((t) => t.phaseMin <= input.phase);

  const run = async (client: Prisma.TransactionClient) => {
    const sectorIdsBySlug: Record<string, string> = {};
    const created: string[] = [];
    const updated: string[] = [];

    let defaultBranchId = input.branchId ?? null;
    if (!defaultBranchId) {
      const branch = await client.branch.findFirst({
        where: { organizationId: input.organizationId, isDefault: true },
        select: { id: true },
      });
      defaultBranchId = branch?.id ?? null;
    }

    for (const tpl of applicable) {
      const visibility = resolveVisibilityForPhase(tpl, input.phase);
      const existing = await client.sector.findFirst({
        where: {
          organizationId: input.organizationId,
          slug: tpl.sectorSlug,
        },
      });

      if (existing) {
        await client.sector.update({
          where: { id: existing.id },
          data: {
            name: tpl.displayName,
            coreSectorSlug: tpl.coreSectorSlug,
            visibilityStatus: visibility,
            isAggregator: tpl.isAggregator,
            branchId: tpl.isAggregator ? null : defaultBranchId,
          },
        });
        sectorIdsBySlug[tpl.sectorSlug] = existing.id;
        updated.push(tpl.sectorSlug);
      } else {
        const row = await client.sector.create({
          data: {
            id: randomUUID(),
            organizationId: input.organizationId,
            branchId: tpl.isAggregator ? null : defaultBranchId,
            name: tpl.displayName,
            slug: tpl.sectorSlug,
            coreSectorSlug: tpl.coreSectorSlug,
            visibilityStatus: visibility,
            isAggregator: tpl.isAggregator,
            moduleShortcuts: [],
          },
        });
        sectorIdsBySlug[tpl.sectorSlug] = row.id;
        created.push(tpl.sectorSlug);

        if (input.ownerMembershipId && tpl.isAggregator) {
          const linked = await client.membershipSector.findFirst({
            where: {
              membershipId: input.ownerMembershipId,
              sectorId: row.id,
            },
          });
          if (!linked) {
            await client.membershipSector.create({
              data: {
                membershipId: input.ownerMembershipId,
                sectorId: row.id,
              },
            });
          }
        }
      }
    }

    return { sectorIdsBySlug, created, updated };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

export interface DistributeModulesInput {
  organizationId: string;
  marketSegmentSlug: string;
  phase: Fase;
  activeModuleIds: string[];
}

/** Distribui módulos ativos da org nos setores conforme template (primário + atalhos). */
export async function distributeModulesToSectors(
  input: DistributeModulesInput,
): Promise<void> {
  const segmentSlug = resolveSegmentSlugForProvisioning(input.marketSegmentSlug);
  const moduleTemplates = await listSegmentSectorModuleTemplates(segmentSlug);
  const activeSet = new Set(input.activeModuleIds);

  const sectors = await prisma.sector.findMany({
    where: { organizationId: input.organizationId },
    select: {
      id: true,
      slug: true,
      coreSectorSlug: true,
      moduleShortcuts: true,
    },
  });
  const bySlug = new Map(sectors.map((s) => [s.slug, s]));
  const byCore = new Map<string, typeof sectors>();
  for (const s of sectors) {
    if (!s.coreSectorSlug) continue;
    const list = byCore.get(s.coreSectorSlug) ?? [];
    list.push(s);
    byCore.set(s.coreSectorSlug, list);
  }

  const modulesByPrimarySector = new Map<string, string[]>();
  const shortcutsBySector = new Map<string, ModuleShortcut[]>();

  for (const tpl of moduleTemplates) {
    if (tpl.phaseMin > input.phase) continue;
    if (!activeSet.has(tpl.moduleId)) continue;

    const primarySector = [...byCore.get(tpl.coreSectorSlug) ?? []].find(
      (s) => s.slug !== "geral" || tpl.coreSectorSlug === "comercial",
    );
    const primary =
      bySlug.get(
        applicableSectorSlugForCore(segmentSlug, tpl.coreSectorSlug, bySlug),
      ) ?? primarySector;
    if (!primary) continue;

    const ids = modulesByPrimarySector.get(primary.id) ?? [];
    if (!ids.includes(tpl.moduleId)) ids.push(tpl.moduleId);
    modulesByPrimarySector.set(primary.id, ids);

    for (const shortcutCore of tpl.shortcutCoreSectorSlugs) {
      const targets = byCore.get(shortcutCore) ?? [];
      for (const target of targets) {
        if (target.id === primary.id) continue;
        const shortcuts = shortcutsBySector.get(target.id) ?? [];
        if (!shortcuts.some((s) => s.moduleId === tpl.moduleId)) {
          shortcuts.push({
            moduleId: tpl.moduleId,
            primarySectorSlug: primary.slug,
          });
          shortcutsBySector.set(target.id, shortcuts);
        }
      }
    }
  }

  for (const [sectorId, moduleIds] of modulesByPrimarySector) {
    await setSectorModules(sectorId, moduleIds);
  }

  for (const [sectorId, shortcuts] of shortcutsBySector) {
    await prisma.sector.update({
      where: { id: sectorId },
      data: { moduleShortcuts: shortcuts },
    });
  }

  const aggregator = sectors.find((s) => s.slug === "geral");
  if (aggregator && !modulesByPrimarySector.has(aggregator.id)) {
    await setSectorModules(aggregator.id, [...activeSet]);
  }
}

function applicableSectorSlugForCore(
  _segmentSlug: string,
  coreSectorSlug: string,
  bySlug: Map<string, { slug: string; coreSectorSlug: string | null }>,
): string {
  for (const [slug, row] of bySlug) {
    if (row.coreSectorSlug === coreSectorSlug && slug !== "geral") return slug;
  }
  return "geral";
}

export interface PreparePhaseExpansionInput {
  organizationId: string;
  targetPhase: Fase;
  marketSegmentSlug: string;
}

/** Provisiona setores da nova fase e marca wizard pendente (dono confirma módulos). */
export async function preparePhaseExpansion(
  input: PreparePhaseExpansionInput,
): Promise<ProvisionSectorsResult> {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { phase: true, declaredPhase: true },
  });
  if (!org) throw new Error("Organização não encontrada");

  const result = await provisionSectorsForPhase({
    organizationId: input.organizationId,
    marketSegmentSlug: input.marketSegmentSlug,
    phase: input.targetPhase,
  });

  await prisma.organization.update({
    where: { id: input.organizationId },
    data: {
      pendingExpansionPhase: input.targetPhase,
    },
  });

  await recordProvisioningPlatformActivity({
    organizationId: input.organizationId,
    activityType: "tenant.phase_expansion_prepared",
    body: `Expansão P${input.targetPhase} preparada — setores: ${[...result.created, ...result.updated].join(", ")}`,
  });

  return result;
}

export interface ConfirmPhaseExpansionInput {
  organizationId: string;
  targetPhase: Fase;
  marketSegmentSlug: string;
  activeModuleIds: string[];
}

/** Confirma expansão após wizard: atualiza fase, módulos e visibilidade. */
export async function confirmPhaseExpansion(
  input: ConfirmPhaseExpansionInput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: input.organizationId },
      data: {
        phase: input.targetPhase,
        declaredPhase: input.targetPhase,
        pendingExpansionPhase: null,
      },
    });

    const templates = await listSegmentSectorTemplates(
      resolveSegmentSlugForProvisioning(input.marketSegmentSlug),
    );

    for (const tpl of templates.filter((t) => t.phaseMin <= input.targetPhase)) {
      const visibility =
        tpl.phaseMin === input.targetPhase && tpl.visibilityDefault === "hidden"
          ? "active"
          : resolveVisibilityForPhase(tpl, input.targetPhase);
      await tx.sector.updateMany({
        where: {
          organizationId: input.organizationId,
          slug: tpl.sectorSlug,
        },
        data: { visibilityStatus: visibility },
      });
    }
  });

  await distributeModulesToSectors({
    organizationId: input.organizationId,
    marketSegmentSlug: input.marketSegmentSlug,
    phase: input.targetPhase,
    activeModuleIds: input.activeModuleIds,
  });

  await recordProvisioningPlatformActivity({
    organizationId: input.organizationId,
    activityType: "tenant.phase_expansion_confirmed",
    body: `Expansão P${input.targetPhase} confirmada — ${input.activeModuleIds.length} módulos`,
  });
}

export async function getPendingExpansionPhase(
  organizationId: string,
): Promise<number | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { pendingExpansionPhase: true },
  });
  return org?.pendingExpansionPhase ?? null;
}

export async function listVisibleSectorsForOrg(
  organizationId: string,
  opts?: { includeHidden?: boolean; membershipId?: string },
): Promise<
  {
    id: string;
    name: string;
    slug: string;
    visibilityStatus: SectorVisibility;
    isAggregator: boolean;
    coreSectorSlug: string | null;
    accessState: "active" | "em_breve" | "hidden" | "request_access";
  }[]
> {
  const sectors = await prisma.sector.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  let grantedSectorIds = new Set<string>();
  if (opts?.membershipId) {
    const grants = await prisma.membershipSector.findMany({
      where: { membershipId: opts.membershipId },
      select: { sectorId: true },
    });
    grantedSectorIds = new Set(grants.map((g) => g.sectorId));
  }

  return sectors
    .filter((s) => opts?.includeHidden || s.visibilityStatus !== "hidden")
    .map((s) => {
      const visibility = s.visibilityStatus as SectorVisibility;
      let accessState: "active" | "em_breve" | "hidden" | "request_access" =
        visibility === "em_breve" ? "em_breve" : "active";
      if (visibility === "hidden") accessState = "hidden";
      if (
        opts?.membershipId &&
        !grantedSectorIds.has(s.id) &&
        !s.isAggregator &&
        visibility === "active"
      ) {
        accessState = "request_access";
      }
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        visibilityStatus: visibility,
        isAggregator: s.isAggregator,
        coreSectorSlug: s.coreSectorSlug,
        accessState,
      };
    });
}

/** Downgrade: remove módulos ativados automaticamente na fase rebaixada; manuais permanecem. */
export async function applyPhaseDowngrade(
  organizationId: string,
  fromPhase: Fase,
  toPhase: Fase,
  marketSegmentSlug: string,
): Promise<{ removedModuleIds: string[] }> {
  const segmentSlug = resolveSegmentSlugForProvisioning(marketSegmentSlug);
  const moduleTemplates = await listSegmentSectorModuleTemplates(segmentSlug);
  const autoModuleIds = new Set(
    moduleTemplates
      .filter((m) => m.phaseMin > toPhase && m.phaseMin <= fromPhase)
      .map((m) => m.moduleId),
  );

  const active = await prisma.moduloAtivo.findMany({
    where: { organizationId },
    select: { moduloId: true },
  });
  const toRemove = active
    .map((r) => r.moduloId)
    .filter((id) => autoModuleIds.has(id));

  if (toRemove.length > 0) {
    await prisma.moduloAtivo.deleteMany({
      where: {
        organizationId,
        moduloId: { in: toRemove },
      },
    });
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { phase: toPhase, declaredPhase: toPhase },
  });

  await recordProvisioningPlatformActivity({
    organizationId,
    activityType: "tenant.phase_downgrade",
    body: `Downgrade P${fromPhase}→P${toPhase}; módulos automáticos removidos: ${toRemove.join(", ") || "nenhum"}. Comercial notificado.`,
  });

  const remaining = active
    .map((r) => r.moduloId)
    .filter((id) => !toRemove.includes(id));
  await distributeModulesToSectors({
    organizationId,
    marketSegmentSlug: segmentSlug,
    phase: toPhase,
    activeModuleIds: remaining,
  });

  return { removedModuleIds: toRemove };
}

export async function seedSegmentSectorTemplatesFromJson(): Promise<{
  sectors: number;
  modules: number;
}> {
  const data = loadTemplatesJson();
  let sectors = 0;
  let modules = 0;

  for (const t of data.sectorTemplates) {
    await prisma.segmentSectorTemplate.upsert({
      where: {
        segmentSlug_sectorSlug: {
          segmentSlug: t.segmentSlug,
          sectorSlug: t.sectorSlug,
        },
      },
      create: {
        segmentSlug: t.segmentSlug,
        phaseMin: t.phaseMin,
        coreSectorSlug: t.coreSectorSlug,
        displayName: t.displayName,
        sectorSlug: t.sectorSlug,
        visibilityDefault: t.visibilityDefault,
        isAggregator: t.isAggregator,
        ordem: t.ordem,
      },
      update: {
        phaseMin: t.phaseMin,
        coreSectorSlug: t.coreSectorSlug,
        displayName: t.displayName,
        visibilityDefault: t.visibilityDefault,
        isAggregator: t.isAggregator,
        ordem: t.ordem,
      },
    });
    sectors += 1;
  }

  for (const m of data.moduleTemplates) {
    await prisma.segmentSectorModuleTemplate.upsert({
      where: {
        segmentSlug_moduleId_coreSectorSlug: {
          segmentSlug: m.segmentSlug,
          moduleId: m.moduleId,
          coreSectorSlug: m.coreSectorSlug,
        },
      },
      create: {
        segmentSlug: m.segmentSlug,
        coreSectorSlug: m.coreSectorSlug,
        moduleId: m.moduleId,
        phaseMin: m.phaseMin,
        shortcutCoreSectorSlugs: m.shortcutCoreSectorSlugs,
      },
      update: {
        phaseMin: m.phaseMin,
        shortcutCoreSectorSlugs: m.shortcutCoreSectorSlugs,
      },
    });
    modules += 1;
  }

  return { sectors, modules };
}
