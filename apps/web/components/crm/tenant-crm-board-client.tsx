"use client";

import type { CrmBoardRecord } from "@boilerplate/crm";
import {
  TENANT_CRM_PIPELINE_STAGES,
  TENANT_CRM_STAGE_LABELS,
} from "@boilerplate/crm";
import { CrmBoard } from "@boilerplate/crm-ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addCrmNoteAction,
  checkNewLeadDuplicatesAction,
  createCrmDealAction,
  createCrmLeadAction,
  listCrmOwnersAction,
  loadCrmLeadDetailAction,
  loadCrmLeadDuplicatesAction,
  loadCrmNotesAction,
  loadCrmTimelineAction,
  mergeCrmLeadsAction,
  moveCrmStageAction,
  updateCrmLeadAction,
} from "@/app/actions/crm";

export function TenantCrmBoardClient({
  records,
  canEdit,
  clients,
}: {
  records: CrmBoardRecord[];
  canEdit: boolean;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [dealClientId, setDealClientId] = useState("");
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealSaving, setDealSaving] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {canEdit ? (
        <div className="flex flex-wrap items-end gap-2">
          {showDealForm ? (
            <form
              className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!dealClientId) return;
                setDealSaving(true);
                try {
                  await createCrmDealAction({ clientId: dealClientId });
                  setDealClientId("");
                  setShowDealForm(false);
                  router.refresh();
                } finally {
                  setDealSaving(false);
                }
              }}
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <select
                  className="min-w-[200px] rounded-md border bg-background px-2 py-1.5"
                  value={dealClientId}
                  onChange={(e) => setDealClientId(e.target.value)}
                  required
                >
                  <option value="">Selecione…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={dealSaving || !dealClientId}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                Criar oportunidade
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 text-sm"
                onClick={() => setShowDealForm(false)}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted/50"
              onClick={() => setShowDealForm(true)}
            >
              + Nova oportunidade
            </button>
          )}
        </div>
      ) : null}

      <CrmBoard
        records={records}
        initialView="pipeline"
        allowedViews={["pipeline", "list"]}
        canEdit={canEdit}
        moduleLabels={{ "core-clientes": "Clientes" }}
        pipelineStages={TENANT_CRM_PIPELINE_STAGES}
        stageLabels={TENANT_CRM_STAGE_LABELS}
        newLeadColumnId="prospect"
        hidePhaseControls
        recordKindLabels={{ lead: "Lead", organization: "Oportunidade" }}
        searchPlaceholder="Buscar lead ou oportunidade…"
        onMovePhase={async () => {}}
        onMoveStage={async (id, kind, stage) => {
          const prev = records.find((r) => r.id === id && r.kind === kind)
            ?.pipelineStage;
          await moveCrmStageAction(id, kind, stage, String(prev));
          router.refresh();
        }}
        onLoadNotes={loadCrmNotesAction}
        onLoadTimeline={loadCrmTimelineAction}
        onAddNote={async (id, kind, body) => {
          await addCrmNoteAction(id, kind, body);
          router.refresh();
        }}
        onCreateLead={
          canEdit
            ? async (input) => {
                await createCrmLeadAction(input);
                router.refresh();
              }
            : undefined
        }
        onCheckNewLeadDuplicates={
          canEdit ? checkNewLeadDuplicatesAction : undefined
        }
        onLoadLeadDetail={loadCrmLeadDetailAction}
        onSaveLeadDetail={
          canEdit
            ? async (id, input) => {
                await updateCrmLeadAction(id, input);
                router.refresh();
              }
            : undefined
        }
        onLoadLeadDuplicates={loadCrmLeadDuplicatesAction}
        onMergeLeads={
          canEdit
            ? async (targetId, sourceId) => {
                await mergeCrmLeadsAction(targetId, sourceId);
                router.refresh();
              }
            : undefined
        }
        onLoadCrmOwners={listCrmOwnersAction}
      />
    </div>
  );
}
