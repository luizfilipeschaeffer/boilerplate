import type { Fase } from "@boilerplate/shared";
import { FASES, CRM_PIPELINE_STAGES } from "./labels";
import type { CrmBoardRecord, CrmPipelineStage } from "./types";

export function groupByPhase(
  records: CrmBoardRecord[],
): Record<Fase, CrmBoardRecord[]> {
  const groups = Object.fromEntries(
    FASES.map((f) => [f, [] as CrmBoardRecord[]]),
  ) as Record<Fase, CrmBoardRecord[]>;

  for (const record of records) {
    const phase = record.phase;
    if (phase >= 1 && phase <= 4) {
      groups[phase as Fase].push(record);
    }
  }
  return groups;
}

export function groupByPipelineStage(
  records: CrmBoardRecord[],
): Record<CrmPipelineStage, CrmBoardRecord[]> {
  const groups = Object.fromEntries(
    CRM_PIPELINE_STAGES.map((s) => [s, [] as CrmBoardRecord[]]),
  ) as Record<CrmPipelineStage, CrmBoardRecord[]>;

  for (const record of records) {
    groups[record.pipelineStage]?.push(record);
  }
  return groups;
}
