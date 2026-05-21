"use client";

import type {
  CrmBoardRecord,
  CrmNote,
  CrmPipelineStage,
  CrmRecordKind,
  CreateLeadInput,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import {
  CRM_PIPELINE_STAGES,
  CRM_STAGE_LABELS,
  FASE_LABELS,
  FASES,
  groupByPhase,
  groupByPipelineStage,
} from "@boilerplate/crm";
import { useMemo, useState } from "react";
import { CreateLeadForm, CrmRecordSheet } from "./crm-record-sheet";
import { CrmKanban } from "./crm-kanban";
import { CrmListView } from "./crm-list-view";

export type CrmBoardView = "phase" | "pipeline" | "list";

export interface CrmBoardProps {
  records: CrmBoardRecord[];
  initialView?: CrmBoardView;
  canEdit: boolean;
  moduleLabels: Record<string, string>;
  availableModuleIds?: string[];
  onMovePhase: (id: string, kind: CrmRecordKind, phase: Fase) => Promise<void>;
  onMoveStage: (
    id: string,
    kind: CrmRecordKind,
    stage: CrmPipelineStage,
  ) => Promise<void>;
  onLoadNotes: (id: string, kind: CrmRecordKind) => Promise<CrmNote[]>;
  onAddNote: (id: string, kind: CrmRecordKind, body: string) => Promise<void>;
  onUpdateModules?: (organizationId: string, moduleIds: string[]) => Promise<void>;
  onCreateLead?: (input: CreateLeadInput) => Promise<void>;
}

export function CrmBoard({
  records,
  initialView = "pipeline",
  canEdit,
  moduleLabels,
  availableModuleIds,
  onMovePhase,
  onMoveStage,
  onLoadNotes,
  onAddNote,
  onUpdateModules,
  onCreateLead,
}: CrmBoardProps) {
  const [view, setView] = useState<CrmBoardView>(initialView);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmBoardRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (typeof r.meta.slug === "string" &&
          r.meta.slug.toLowerCase().includes(q)) ||
        (typeof r.meta.tipoNegocio === "string" &&
          r.meta.tipoNegocio.toLowerCase().includes(q)),
    );
  }, [records, query]);

  const phaseColumns = useMemo(() => {
    const groups = groupByPhase(filtered);
    return FASES.map((f) => ({
      id: String(f),
      title: FASE_LABELS[f],
      records: groups[f],
    }));
  }, [filtered]);

  const pipelineColumns = useMemo(() => {
    const groups = groupByPipelineStage(filtered);
    return CRM_PIPELINE_STAGES.map((s) => ({
      id: s,
      title: CRM_STAGE_LABELS[s],
      records: groups[s],
    }));
  }, [filtered]);

  async function handleKanbanDrop(
    record: CrmBoardRecord,
    columnId: string,
    mode: "phase" | "pipeline",
  ) {
    if (mode === "phase") {
      const phase = Number(columnId) as Fase;
      if (phase >= 1 && phase <= 4 && phase !== record.phase) {
        await onMovePhase(record.id, record.kind, phase);
      }
    } else {
      const stage = columnId as CrmPipelineStage;
      if (CRM_PIPELINE_STAGES.includes(stage) && stage !== record.pipelineStage) {
        await onMoveStage(record.id, record.kind, stage);
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border p-0.5">
          {(
            [
              ["phase", "Fase"],
              ["pipeline", "Pipeline"],
              ["list", "Lista"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                view === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar nome, slug ou tipo…"
          className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {view === "list" ? (
        <CrmListView
          records={filtered}
          moduleLabels={moduleLabels}
          onOpenRecord={(r) => {
            setSelected(r);
            setSheetOpen(true);
          }}
        />
      ) : (
        <CrmKanban
          columns={view === "phase" ? phaseColumns : pipelineColumns}
          moduleLabels={moduleLabels}
          canEdit={canEdit}
          onOpenRecord={(r) => {
            setSelected(r);
            setSheetOpen(true);
          }}
          onDrop={(record, columnId) =>
            handleKanbanDrop(record, columnId, view === "phase" ? "phase" : "pipeline")
          }
          leadColumnFooter={
            view === "pipeline" && canEdit && onCreateLead ? (
              showLeadForm ? (
                <CreateLeadForm
                  onCancel={() => setShowLeadForm(false)}
                  onSubmit={async (input) => {
                    await onCreateLead(input);
                    setShowLeadForm(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md border border-dashed px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
                  onClick={() => setShowLeadForm(true)}
                >
                  + Novo lead
                </button>
              )
            ) : undefined
          }
        />
      )}

      <CrmRecordSheet
        record={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        canEdit={canEdit}
        moduleLabels={moduleLabels}
        availableModuleIds={availableModuleIds}
        onLoadNotes={onLoadNotes}
        onAddNote={onAddNote}
        onUpdatePhase={onMovePhase}
        onUpdateStage={onMoveStage}
        onUpdateModules={onUpdateModules}
      />
    </div>
  );
}
