"use client";

import type {
  CrmBoardRecord,
  CrmLeadDetail,
  CrmLeadDuplicate,
  CrmNote,
  CrmPipelineStage,
  CrmRecordKind,
  CrmTimelineEntry,
  CreateLeadInput,
  UpdateLeadInput,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import {
  CRM_PIPELINE_STAGES,
  CRM_STAGE_LABELS,
  FASE_LABELS,
  FASES,
  groupByPhase,
  groupByStages,
} from "@boilerplate/crm";
import { useMemo, useState } from "react";
import { CreateLeadForm, CrmRecordSheet } from "./crm-record-sheet";
import { CrmKanban } from "./crm-kanban";
import { CrmListView } from "./crm-list-view";

export type CrmBoardView = "phase" | "pipeline" | "list";

export interface CrmBoardProps {
  records: CrmBoardRecord[];
  initialView?: CrmBoardView;
  allowedViews?: CrmBoardView[];
  canEdit: boolean;
  moduleLabels: Record<string, string>;
  availableModuleIds?: string[];
  pipelineStages?: readonly string[];
  stageLabels?: Record<string, string>;
  newLeadColumnId?: string;
  hidePhaseControls?: boolean;
  recordKindLabels?: Partial<Record<CrmRecordKind, string>>;
  searchPlaceholder?: string;
  onMovePhase: (id: string, kind: CrmRecordKind, phase: Fase) => Promise<void>;
  onMoveStage: (
    id: string,
    kind: CrmRecordKind,
    stage: CrmPipelineStage,
  ) => Promise<void>;
  onLoadNotes: (id: string, kind: CrmRecordKind) => Promise<CrmNote[]>;
  onLoadTimeline?: (id: string, kind: CrmRecordKind) => Promise<CrmTimelineEntry[]>;
  onAddNote: (id: string, kind: CrmRecordKind, body: string) => Promise<void>;
  onUpdateModules?: (organizationId: string, moduleIds: string[]) => Promise<void>;
  onCreateLead?: (input: CreateLeadInput) => Promise<void>;
  onCheckNewLeadDuplicates?: (input: {
    email?: string | null;
    phone?: string | null;
    cnpj?: string | null;
  }) => Promise<CrmLeadDuplicate[]>;
  onLoadLeadDetail?: (leadId: string) => Promise<CrmLeadDetail>;
  onSaveLeadDetail?: (leadId: string, input: UpdateLeadInput) => Promise<void>;
  onLoadLeadDuplicates?: (leadId: string) => Promise<CrmLeadDuplicate[]>;
  onMergeLeads?: (targetId: string, sourceId: string) => Promise<void>;
  onLoadCrmOwners?: () => Promise<{ userId: string; name: string }[]>;
}

export function CrmBoard({
  records,
  initialView = "pipeline",
  allowedViews,
  canEdit,
  moduleLabels,
  availableModuleIds,
  pipelineStages,
  stageLabels,
  newLeadColumnId = "lead",
  hidePhaseControls = false,
  recordKindLabels,
  searchPlaceholder = "Buscar nome, slug ou tipo…",
  onMovePhase,
  onMoveStage,
  onLoadNotes,
  onLoadTimeline,
  onAddNote,
  onUpdateModules,
  onCreateLead,
  onCheckNewLeadDuplicates,
  onLoadLeadDetail,
  onSaveLeadDetail,
  onLoadLeadDuplicates,
  onMergeLeads,
  onLoadCrmOwners,
}: CrmBoardProps) {
  const views = allowedViews ?? (["phase", "pipeline", "list"] as const);
  const resolvedInitial =
    views.includes(initialView) ? initialView : views[0] ?? "pipeline";

  const [view, setView] = useState<CrmBoardView>(resolvedInitial);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmBoardRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const stages = pipelineStages ?? CRM_PIPELINE_STAGES;
  const labels: Record<string, string> = stageLabels
    ? stageLabels
    : (CRM_STAGE_LABELS as Record<string, string>);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (typeof r.meta.slug === "string" &&
          r.meta.slug.toLowerCase().includes(q)) ||
        (typeof r.meta.tipoNegocio === "string" &&
          r.meta.tipoNegocio.toLowerCase().includes(q)) ||
        (typeof r.meta.email === "string" &&
          r.meta.email.toLowerCase().includes(q)),
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
    const groups = groupByStages(filtered, stages);
    return stages.map((s) => ({
      id: s,
      title: labels[s] ?? s,
      records: groups[s] ?? [],
    }));
  }, [filtered, stages, labels]);

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
      if (stages.includes(stage) && stage !== record.pipelineStage) {
        await onMoveStage(record.id, record.kind, stage);
      }
    }
  }

  const viewTabs: { id: CrmBoardView; label: string }[] = [
    ...(views.includes("phase")
      ? [{ id: "phase" as const, label: "Fase" }]
      : []),
    ...(views.includes("pipeline")
      ? [{ id: "pipeline" as const, label: "Pipeline" }]
      : []),
    ...(views.includes("list") ? [{ id: "list" as const, label: "Lista" }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {viewTabs.length > 1 ? (
          <div className="inline-flex rounded-lg border p-0.5">
            {viewTabs.map(({ id, label }) => (
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
        ) : (
          <span className="text-sm font-medium text-muted-foreground">Pipeline</span>
        )}
        <input
          type="search"
          placeholder={searchPlaceholder}
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
          newLeadColumnId={newLeadColumnId}
          leadColumnFooter={
            view === "pipeline" && canEdit && onCreateLead ? (
              showLeadForm ? (
                <CreateLeadForm
                  onCancel={() => setShowLeadForm(false)}
                  onCheckDuplicates={onCheckNewLeadDuplicates}
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
        pipelineStages={pipelineStages ? [...stages] : undefined}
        stageLabels={stageLabels}
        hidePhaseControls={hidePhaseControls}
        recordKindLabels={recordKindLabels}
        onLoadNotes={onLoadNotes}
        onLoadTimeline={onLoadTimeline}
        onAddNote={onAddNote}
        onUpdatePhase={onMovePhase}
        onUpdateStage={onMoveStage}
        onUpdateModules={onUpdateModules}
        onLoadLeadDetail={onLoadLeadDetail}
        onSaveLeadDetail={onSaveLeadDetail}
        onLoadLeadDuplicates={onLoadLeadDuplicates}
        onMergeLeads={onMergeLeads}
        onLoadCrmOwners={onLoadCrmOwners}
      />
    </div>
  );
}
