"use client";

import type { CrmBoardRecord } from "@boilerplate/crm";
import { CrmBoard, type CrmBoardView } from "@boilerplate/crm-ui";
import type { CreateLeadInput } from "@boilerplate/crm";
import {
  addCrmNoteAction,
  createPlatformLeadAction,
  loadCrmNotesAction,
  loadCrmTimelineAction,
  moveCrmPhaseAction,
  moveCrmStageAction,
  updateOrgModulesAction,
} from "./actions";

export function PlatformCrmBoardClient({
  records,
  initialView,
  canEdit,
  moduleLabels,
  availableModuleIds,
}: {
  records: CrmBoardRecord[];
  initialView?: CrmBoardView;
  canEdit: boolean;
  moduleLabels: Record<string, string>;
  availableModuleIds: string[];
}) {
  return (
    <CrmBoard
      records={records}
      initialView={initialView}
      canEdit={canEdit}
      moduleLabels={moduleLabels}
      availableModuleIds={availableModuleIds}
      onMovePhase={async (id, kind, phase) => {
        await moveCrmPhaseAction(id, kind, phase);
      }}
      onMoveStage={async (id, kind, stage) => {
        await moveCrmStageAction(id, kind, stage);
      }}
      onLoadNotes={loadCrmNotesAction}
      onLoadTimeline={loadCrmTimelineAction}
      onAddNote={async (id, kind, body) => {
        await addCrmNoteAction(id, kind, body);
      }}
      onUpdateModules={
        canEdit
          ? async (organizationId, moduleIds) => {
              await updateOrgModulesAction(organizationId, moduleIds);
            }
          : undefined
      }
      onCreateLead={
        canEdit
          ? async (input: CreateLeadInput) => {
              await createPlatformLeadAction(input);
            }
          : undefined
      }
    />
  );
}
