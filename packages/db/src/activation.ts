import {
  classificarFase,
  modulosDemanda,
  modulosParaAtivar,
  recomendarModulos,
  validateModuleActivation,
  type DiagnosticoInput,
} from "@boilerplate/module-registry";
import type { Fase } from "@boilerplate/shared";
import { prisma } from "./client";

export type ProvisioningStatus =
  | "pending_payment"
  | "pre_active"
  | "trial"
  | "active"
  | "blocked";

export interface ResolveActivationInput {
  marketSegmentSlug: string;
  phase: Fase;
  tipoNegocio: DiagnosticoInput["tipoNegocio"];
  possuiCnpj?: boolean;
  diagnostico?: DiagnosticoInput;
}

export interface ActivationPackage {
  moduleIds: string[];
  bundlePrecoId: string | null;
  requiresPaymentValidation: boolean;
  trialDays: number;
  preActivateModules: boolean;
  fallbackUsed: boolean;
  demandaModuleIds: string[];
}

function parseModuleIds(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

export async function expandModuleIds(
  moduleIds: string[],
): Promise<string[]> {
  const resolved = new Set<string>();
  for (const moduleId of moduleIds) {
    const next = await expandOneModule(moduleId, [...resolved]);
    for (const id of next) resolved.add(id);
  }
  return [...resolved];
}

async function expandOneModule(
  moduleId: string,
  current: string[],
): Promise<string[]> {
  const modulo = await validateModuleActivation(moduleId, current);
  const next = new Set(current);
  next.add(modulo.id);
  if (modulo.parentModuleId) next.add(modulo.parentModuleId);
  return [...next];
}

export async function resolveActivationPackage(
  input: ResolveActivationInput,
): Promise<ActivationPackage> {
  const config = await prisma.segmentPhaseConfig.findUnique({
    where: {
      segmentSlug_phase: {
        segmentSlug: input.marketSegmentSlug,
        phase: input.phase,
      },
    },
    include: { bundlePreco: true },
  });

  if (config?.ativo) {
    const fromBundle =
      config.bundlePreco?.ativo && config.bundlePrecoId
        ? parseModuleIds(config.bundlePreco.moduleIds)
        : [];
    const extra = parseModuleIds(config.moduleIds);
    const candidateIds = [...new Set([...fromBundle, ...extra])];

    if (candidateIds.length > 0) {
      const recomendacoes = fallbackRecommendations(input);
      const demanda = modulosDemanda(recomendacoes);
      const activatable = candidateIds.filter(
        (id) => !demanda.includes(id),
      );
      const expanded = await expandModuleIds(activatable);

      return {
        moduleIds: expanded,
        bundlePrecoId: config.bundlePrecoId,
        requiresPaymentValidation: config.requiresPaymentValidation,
        trialDays: config.trialDays,
        preActivateModules: config.preActivateModules,
        fallbackUsed: false,
        demandaModuleIds: demanda,
      };
    }
  }

  return resolveActivationFallback(input);
}

function fallbackRecommendations(input: ResolveActivationInput) {
  const diag: DiagnosticoInput = input.diagnostico ?? {
    tipoNegocio: input.tipoNegocio,
    segmentoAtuacao: input.marketSegmentSlug,
    temPontoFixo: false,
    vendasMes: "ate50",
    temFuncionarios: false,
    emiteNota: null,
    possuiCnpj: input.possuiCnpj ?? false,
  };
  const fase =
    input.phase ?? classificarFase(diag);
  return recomendarModulos(fase, input.tipoNegocio, {
    possuiCnpj: input.possuiCnpj,
  });
}

async function resolveActivationFallback(
  input: ResolveActivationInput,
): Promise<ActivationPackage> {
  const recomendacoes = fallbackRecommendations(input);
  const toActivate = modulosParaAtivar(recomendacoes);
  const expanded = await expandModuleIds(toActivate);
  const phase = input.phase;
  const requiresPayment = phase >= 3;

  return {
    moduleIds: expanded,
    bundlePrecoId: null,
    requiresPaymentValidation: requiresPayment,
    trialDays: 14,
    preActivateModules: true,
    fallbackUsed: true,
    demandaModuleIds: modulosDemanda(recomendacoes),
  };
}

export function computeProvisioningStatus(
  pkg: ActivationPackage,
  paymentVerified: boolean,
): ProvisioningStatus {
  if (pkg.requiresPaymentValidation && !paymentVerified) {
    return pkg.preActivateModules ? "pre_active" : "pending_payment";
  }
  return "trial";
}

export function trialEndFromNow(trialDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + trialDays);
  return d;
}
