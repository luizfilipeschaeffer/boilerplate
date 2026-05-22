import { PACOTES_POR_FASE } from "@boilerplate/module-registry";
import type { Fase } from "@boilerplate/shared";
import { prisma } from "./client";
import { writePlatformConfigAudit } from "./platform-audit";

export type MarketSegmentRow = {
  slug: string;
  name: string;
  ordem: number;
  ativo: boolean;
  icone: string | null;
  tipoNegocioSugeridos: string[];
};

export type SegmentPhaseConfigRow = {
  id: string;
  segmentSlug: string;
  phase: number;
  bundlePrecoId: string | null;
  moduleIds: string[];
  requiresPaymentValidation: boolean;
  trialDays: number;
  preActivateModules: boolean;
  ativo: boolean;
};

function parseJsonStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

function mapSegment(s: {
  slug: string;
  name: string;
  ordem: number;
  ativo: boolean;
  icone: string | null;
  tipoNegocioSugeridos: unknown;
}): MarketSegmentRow {
  return {
    slug: s.slug,
    name: s.name,
    ordem: s.ordem,
    ativo: s.ativo,
    icone: s.icone,
    tipoNegocioSugeridos: parseJsonStringArray(s.tipoNegocioSugeridos),
  };
}

function mapPhaseConfig(c: {
  id: string;
  segmentSlug: string;
  phase: number;
  bundlePrecoId: string | null;
  moduleIds: unknown;
  requiresPaymentValidation: boolean;
  trialDays: number;
  preActivateModules: boolean;
  ativo: boolean;
}): SegmentPhaseConfigRow {
  return {
    id: c.id,
    segmentSlug: c.segmentSlug,
    phase: c.phase,
    bundlePrecoId: c.bundlePrecoId,
    moduleIds: parseJsonStringArray(c.moduleIds),
    requiresPaymentValidation: c.requiresPaymentValidation,
    trialDays: c.trialDays,
    preActivateModules: c.preActivateModules,
    ativo: c.ativo,
  };
}

export async function listMarketSegments(opts?: {
  ativoOnly?: boolean;
  tipoNegocio?: string;
}): Promise<MarketSegmentRow[]> {
  const rows = await prisma.marketSegment.findMany({
    where: opts?.ativoOnly ? { ativo: true } : undefined,
    orderBy: { ordem: "asc" },
  });
  let list = rows.map(mapSegment);
  if (opts?.tipoNegocio) {
    list = list.filter(
      (s) =>
        s.tipoNegocioSugeridos.length === 0 ||
        s.tipoNegocioSugeridos.includes(opts.tipoNegocio!),
    );
  }
  return list;
}

export async function getMarketSegment(
  slug: string,
): Promise<MarketSegmentRow | null> {
  const row = await prisma.marketSegment.findUnique({ where: { slug } });
  return row ? mapSegment(row) : null;
}

export async function upsertMarketSegment(
  input: {
    slug: string;
    name: string;
    ordem?: number;
    ativo?: boolean;
    icone?: string | null;
    tipoNegocioSugeridos?: string[];
  },
  actorPlatformUserId?: string | null,
): Promise<MarketSegmentRow> {
  const row = await prisma.marketSegment.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      ordem: input.ordem ?? 0,
      ativo: input.ativo ?? true,
      icone: input.icone ?? null,
      tipoNegocioSugeridos: input.tipoNegocioSugeridos ?? [],
    },
    update: {
      name: input.name,
      ordem: input.ordem,
      ativo: input.ativo,
      icone: input.icone,
      tipoNegocioSugeridos: input.tipoNegocioSugeridos,
    },
  });
  await writePlatformConfigAudit({
    entityType: "segment",
    entityId: row.slug,
    action: "upsert",
    actorPlatformUserId,
    diff: input,
  });
  return mapSegment(row);
}

export async function listSegmentPhaseConfigs(
  segmentSlug: string,
): Promise<SegmentPhaseConfigRow[]> {
  const rows = await prisma.segmentPhaseConfig.findMany({
    where: { segmentSlug },
    orderBy: { phase: "asc" },
  });
  return rows.map(mapPhaseConfig);
}

export async function upsertSegmentPhaseConfig(
  input: {
    segmentSlug: string;
    phase: number;
    bundlePrecoId?: string | null;
    moduleIds?: string[];
    requiresPaymentValidation?: boolean;
    trialDays?: number;
    preActivateModules?: boolean;
    ativo?: boolean;
  },
  actorPlatformUserId?: string | null,
): Promise<SegmentPhaseConfigRow> {
  const row = await prisma.segmentPhaseConfig.upsert({
    where: {
      segmentSlug_phase: {
        segmentSlug: input.segmentSlug,
        phase: input.phase,
      },
    },
    create: {
      segmentSlug: input.segmentSlug,
      phase: input.phase,
      bundlePrecoId: input.bundlePrecoId ?? null,
      moduleIds: input.moduleIds ?? [],
      requiresPaymentValidation: input.requiresPaymentValidation ?? false,
      trialDays: input.trialDays ?? 14,
      preActivateModules: input.preActivateModules ?? true,
      ativo: input.ativo ?? true,
    },
    update: {
      bundlePrecoId: input.bundlePrecoId,
      moduleIds: input.moduleIds,
      requiresPaymentValidation: input.requiresPaymentValidation,
      trialDays: input.trialDays,
      preActivateModules: input.preActivateModules,
      ativo: input.ativo,
    },
  });
  await writePlatformConfigAudit({
    entityType: "segment_phase",
    entityId: `${input.segmentSlug}:${input.phase}`,
    action: "upsert",
    actorPlatformUserId,
    diff: input,
  });
  return mapPhaseConfig(row);
}

/** Defaults P1–P4 para cada segmento (espelha PACOTES_POR_FASE). */
export async function seedDefaultSegmentPhaseConfigs(
  segmentSlug: string,
): Promise<number> {
  let count = 0;
  for (const phase of [1, 2, 3, 4] as Fase[]) {
    const moduleIds = PACOTES_POR_FASE[phase];
    await prisma.segmentPhaseConfig.upsert({
      where: {
        segmentSlug_phase: { segmentSlug, phase },
      },
      create: {
        segmentSlug,
        phase,
        moduleIds,
        requiresPaymentValidation: phase >= 3,
        trialDays: 14,
        preActivateModules: true,
        ativo: true,
      },
      update: {},
    });
    count += 1;
  }
  return count;
}

export async function seedAllSegmentPhaseConfigs(): Promise<number> {
  const segments = await prisma.marketSegment.findMany({ select: { slug: true } });
  let total = 0;
  for (const { slug } of segments) {
    total += await seedDefaultSegmentPhaseConfigs(slug);
  }
  return total;
}
