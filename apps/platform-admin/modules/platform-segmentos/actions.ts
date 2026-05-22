"use server";

import {
  listMarketSegments,
  listOrganizationProvisioning,
  listSegmentPhaseConfigs,
  upsertMarketSegment,
  upsertSegmentPhaseConfig,
  type PlatformRole,
} from "@boilerplate/db";
import { getAllModules, registerAllModules } from "@boilerplate/module-registry";
import type { ModuleDefinition } from "@boilerplate/shared";
import { auth } from "@/auth";
import { canEditSegments } from "./can-edit-segments";

function loadRegistryModules(): ModuleDefinition[] {
  registerAllModules();
  return getAllModules().sort((a, b) => a.name.localeCompare(b.name));
}

async function requireEditor(): Promise<PlatformRole> {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  if (!canEditSegments(role)) {
    throw new Error("Sem permissão para editar segmentos.");
  }
  return role;
}

export async function loadSegmentsList() {
  const segments = await listMarketSegments();
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  return { segments, canEdit: canEditSegments(role) };
}

export async function loadSegmentPhasesData(segmentSlug: string) {
  const [segment, phases] = await Promise.all([
    listMarketSegments().then((list) => list.find((s) => s.slug === segmentSlug) ?? null),
    listSegmentPhaseConfigs(segmentSlug),
  ]);
  if (!segment) throw new Error("Segmento não encontrado.");
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  return {
    segment,
    phases,
    modules: loadRegistryModules(),
    canEdit: canEditSegments(role),
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
  await requireEditor();
  const session = await auth();
  return upsertMarketSegment(
    input,
    session?.user?.id ?? null,
  );
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
  await requireEditor();
  const session = await auth();
  return upsertSegmentPhaseConfig(input, session?.user?.id ?? null);
}

export async function loadActivationsList(status?: string) {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  const ativacoes = await listOrganizationProvisioning({
    status: status as never,
    limit: 200,
  });
  return { ativacoes, canEdit: canEditSegments(role) };
}
