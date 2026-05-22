import type { CrmPipelineStage } from "./types";

/** Pipeline comercial do tenant (`core-crm`). */
export type TenantCrmPipelineStage =
  | "prospect"
  | "qualificado"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export const TENANT_CRM_PIPELINE_STAGES: TenantCrmPipelineStage[] = [
  "prospect",
  "qualificado",
  "proposta",
  "negociacao",
  "ganho",
  "perdido",
];

export const TENANT_CRM_STAGE_LABELS: Record<TenantCrmPipelineStage, string> = {
  prospect: "Prospect",
  qualificado: "Qualificado",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

export function isTenantCrmPipelineStage(
  value: string,
): value is TenantCrmPipelineStage {
  return (TENANT_CRM_PIPELINE_STAGES as readonly string[]).includes(value);
}

export function asTenantPipelineStage(value: string): TenantCrmPipelineStage {
  return isTenantCrmPipelineStage(value) ? value : "prospect";
}

/** Estágio usado em `CrmBoardRecord.pipelineStage` no tenant (cast ao tipo SaaS). */
export function tenantStageAsBoardStage(
  stage: TenantCrmPipelineStage,
): CrmPipelineStage {
  return stage as unknown as CrmPipelineStage;
}
