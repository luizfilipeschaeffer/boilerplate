"use server";

import {
  addActivityForRecord,
  addContactForRecord,
  createPlatformCrmRepository,
  linkLeadToOrganization,
  listActivitiesForRecord,
  listContactsForRecord,
  listPlatformCrmTimeline,
} from "@boilerplate/db";
import type {
  CrmPipelineStage,
  CrmRecordKind,
  CreateLeadInput,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import { canEditCrm } from "./can-edit-crm";
import { requirePlatformModule } from "@/lib/platform-access";
import { revalidatePath } from "next/cache";

async function requireCrmEditor() {
  const ctx = await requirePlatformModule("platform-crm");
  if (!canEditCrm(ctx.platformRole)) {
    throw new Error("Sem permissão para editar o CRM");
  }
  return {
    platformUserId: ctx.userId,
    role: ctx.platformRole,
  };
}

async function requireCrmReader() {
  return requirePlatformModule("platform-crm");
}

function repo() {
  return createPlatformCrmRepository();
}

export async function moveCrmPhaseAction(
  id: string,
  kind: CrmRecordKind,
  phase: Fase,
) {
  await requireCrmEditor();
  await repo().updatePhase(id, kind, phase);
  revalidatePath("/crm");
}

export async function moveCrmStageAction(
  id: string,
  kind: CrmRecordKind,
  stage: CrmPipelineStage,
) {
  await requireCrmEditor();
  await repo().updatePipelineStage(id, kind, stage);
  revalidatePath("/crm");
}

export async function updateOrgModulesAction(
  organizationId: string,
  moduleIds: string[],
) {
  await requireCrmEditor();
  const r = repo();
  if (!r.updateModules) throw new Error("Módulos não suportados");
  await r.updateModules(organizationId, moduleIds);
  revalidatePath("/crm");
}

export async function addCrmNoteAction(
  id: string,
  kind: CrmRecordKind,
  body: string,
) {
  const { platformUserId } = await requireCrmEditor();
  await repo().addNote(id, kind, body, platformUserId);
  revalidatePath("/crm");
}

export async function createPlatformLeadAction(input: CreateLeadInput) {
  await requireCrmEditor();
  const r = repo();
  if (!r.createLead) throw new Error("Criação de lead não disponível");
  await r.createLead(input);
  revalidatePath("/crm");
}

export async function loadCrmNotesAction(id: string, kind: CrmRecordKind) {
  await requireCrmReader();
  return repo().listNotes(id, kind);
}

export async function loadCrmTimelineAction(id: string, kind: CrmRecordKind) {
  await requireCrmReader();
  return listPlatformCrmTimeline(id, kind);
}

export async function loadCrmContactsAction(id: string, kind: CrmRecordKind) {
  await requireCrmReader();
  return listContactsForRecord(id, kind);
}

export async function loadCrmActivitiesAction(id: string, kind: CrmRecordKind) {
  await requireCrmReader();
  return listActivitiesForRecord(id, kind);
}

export async function addCrmContactAction(
  id: string,
  kind: CrmRecordKind,
  input: { name: string; email?: string | null; phone?: string | null; role?: string | null },
) {
  await requireCrmEditor();
  await addContactForRecord(id, kind, input);
  revalidatePath("/crm");
}

export async function addCrmActivityAction(
  id: string,
  kind: CrmRecordKind,
  input: { activityType: "note" | "call" | "meeting"; body: string },
) {
  const { platformUserId } = await requireCrmEditor();
  await addActivityForRecord(id, kind, { ...input, platformUserId });
  revalidatePath("/crm");
}

export async function linkLeadToOrgAction(
  platformLeadId: string,
  organizationId: string,
) {
  await requireCrmEditor();
  await linkLeadToOrganization(platformLeadId, organizationId);
  revalidatePath("/crm");
}
