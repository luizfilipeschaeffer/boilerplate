"use server";

import {
  listMarketSegments,
  listOrganizationProvisioning,
  listSegmentPhaseConfigs,
  upsertMarketSegment,
  upsertSegmentPhaseConfig,
} from "@boilerplate/db";
import { getAllModules, registerAllModules } from "@boilerplate/module-registry";
import type { ModuleDefinition } from "@boilerplate/shared";
import { canEditSegments } from "./can-edit-segments";
import { requirePlatformModule } from "@/lib/platform-access";

function loadRegistryModules(): ModuleDefinition[] {
  registerAllModules();
  return getAllModules().sort((a, b) => a.name.localeCompare(b.name));
}

async function requireEditor() {
  const ctx = await requirePlatformModule("platform-segmentos");
  if (!canEditSegments(ctx.platformRole)) {
    throw new Error("Sem permissão para editar segmentos.");
  }
  return ctx;
}

export async function loadSegmentsList() {
  const ctx = await requirePlatformModule("platform-segmentos");
  const segments = await listMarketSegments();
  return { segments, canEdit: canEditSegments(ctx.platformRole) };
}

export async function loadSegmentPhasesData(segmentSlug: string) {
  const ctx = await requirePlatformModule("platform-segmentos");
  const [segment, phases] = await Promise.all([
    listMarketSegments().then((list) => list.find((s) => s.slug === segmentSlug) ?? null),
    listSegmentPhaseConfigs(segmentSlug),
  ]);
  if (!segment) throw new Error("Segmento não encontrado.");
  return {
    segment,
    phases,
    modules: loadRegistryModules(),
    canEdit: canEditSegments(ctx.platformRole),
  };
}

export async function saveSegmentAction(input: {
  slug: string;
  name: string;
  ordem: number;
  ativo: boolean;
  icone?: string | null;
  tipoNegocioSugeridos?: string[];
}) {
  const ctx = await requireEditor();
  return upsertMarketSegment(input, ctx.userId);
}

export async function saveSegmentPhaseAction(input: {
  segmentSlug: string;
  phase: number;
  bundlePrecoId?: string | null;
  moduleIds?: string[];
  requiresPaymentValidation?: boolean;
  trialDays?: number;
  preActivateModules?: boolean;
  ativo?: boolean;
}) {
  const ctx = await requireEditor();
  return upsertSegmentPhaseConfig(input, ctx.userId);
}

export async function loadActivationsList(status?: string) {
  const ctx = await requirePlatformModule("platform-segmentos");
  const ativacoes = await listOrganizationProvisioning({
    status: status as never,
    limit: 200,
  });
  return { ativacoes, canEdit: canEditSegments(ctx.platformRole) };
}
