import type { Fase } from "@boilerplate/shared";
import type { CrmPipelineStage } from "./types";

export const FASE_LABELS: Record<Fase, string> = {
  1: "Informal",
  2: "Crescendo",
  3: "Estruturado",
  4: "Expansão",
};

export const CRM_STAGE_LABELS: Record<CrmPipelineStage, string> = {
  lead: "Lead",
  trial: "Trial",
  active: "Ativo",
  expansion: "Expansão",
  churn_risk: "Risco de churn",
};

export const CRM_PIPELINE_STAGES: CrmPipelineStage[] = [
  "lead",
  "trial",
  "active",
  "expansion",
  "churn_risk",
];

export const FASES: Fase[] = [1, 2, 3, 4];

const TIPO_NEGOCIO_LABELS: Record<string, string> = {
  pessoa_fisica: "Pessoa física",
  varejo: "Varejo",
  atacado: "Atacado",
  fornecedor: "Fornecedor",
  distribuidor: "Distribuidor",
  transportadora: "Transportadora",
  fabricante: "Fabricante",
  industria: "Indústria",
  produtor_rural: "Produtor rural",
};

export function formatTipoNegocio(id: string | null | undefined): string {
  if (!id) return "—";
  return TIPO_NEGOCIO_LABELS[id] ?? id.replace(/_/g, " ");
}
