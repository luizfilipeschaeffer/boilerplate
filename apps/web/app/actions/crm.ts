"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { requireTenantContext } from "@/lib/tenant-context";
import { roleHasModulePermission } from "@/lib/module-permissions";
import type {
  CrmBoardRecord,
  CrmLeadDetail,
  CrmLeadDuplicate,
  CrmNote,
  CrmPipelineStage,
  CrmRecordKind,
  CreateDealInput,
  CreateLeadInput,
  UpdateLeadInput,
} from "@boilerplate/crm";
import {
  createTenantCrmRepository,
  ensureTenantCrmTables,
  findDuplicatesForNewLead,
  findTenantLeadDuplicates,
  getTenantLeadDetail,
  listClients,
  listTenantCrmOwners,
  listTenantCrmTimeline,
  mergeTenantLeads,
  updateTenantLead,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

async function tenantRepo() {
  const ctx = await requireTenantContext();
  await ensureTenantCrmTables(ctx.schemaName);
  return { ctx, repo: createTenantCrmRepository(ctx.schemaName) };
}

async function requireCrmEditor() {
  const { ctx, repo } = await tenantRepo();
  if (!roleHasModulePermission(ctx.role, "core-crm", "editar")) {
    throw new Error("Sem permissão para editar o CRM");
  }
  return { ctx, repo };
}

export async function listCrmBoardAction(): Promise<CrmBoardRecord[]> {
  const { repo } = await tenantRepo();
  return repo.listBoardRecords();
}

export async function listCrmClientsForDealAction(): Promise<
  { id: string; name: string }[]
> {
  const { ctx } = await tenantRepo();
  const rows = await listClients(ctx.schemaName);
  return rows.filter((c) => c.active).map((c) => ({ id: c.id, name: c.name }));
}

export async function moveCrmStageAction(
  id: string,
  kind: CrmRecordKind,
  stage: CrmPipelineStage,
  previousStage?: string,
) {
  const { ctx, repo } = await requireCrmEditor();
  await repo.updatePipelineStage(id, kind, stage, previousStage);
  await emitAndPersist({
    type: "crm.deal.etapa_alterada",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: {
      targetKind: kind,
      targetId: id,
      from: previousStage ?? null,
      to: stage,
    },
  });
  revalidatePath("/crm");
}

export async function createCrmLeadAction(input: CreateLeadInput) {
  const { ctx, repo } = await requireCrmEditor();
  if (!repo.createLead) throw new Error("CRM indisponível");
  const record = await repo.createLead(input);
  await emitAndPersist({
    type: "crm.lead.criado",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { leadId: record.id, name: input.name },
  });
  revalidatePath("/crm");
}

export async function createCrmDealAction(input: CreateDealInput) {
  const { ctx, repo } = await requireCrmEditor();
  if (!repo.createDeal) throw new Error("CRM indisponível");
  const record = await repo.createDeal(input);
  await emitAndPersist({
    type: "crm.deal.criado",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: {
      dealId: record.id,
      clientId: input.clientId,
      leadId: input.crmLeadId ?? null,
    },
  });
  revalidatePath("/crm");
}

export async function loadCrmTimelineAction(id: string, kind: CrmRecordKind) {
  const { ctx } = await tenantRepo();
  return listTenantCrmTimeline(ctx.schemaName, ctx.organizationId, id, kind);
}

export async function loadCrmNotesAction(
  id: string,
  kind: CrmRecordKind,
): Promise<CrmNote[]> {
  const { repo } = await tenantRepo();
  return repo.listNotes(id, kind);
}

export async function addCrmNoteAction(
  id: string,
  kind: CrmRecordKind,
  body: string,
) {
  const { ctx, repo } = await requireCrmEditor();
  await repo.addNote(id, kind, body);
  await emitAndPersist({
    type: "crm.nota.criada",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { targetKind: kind, targetId: id },
  });
  revalidatePath("/crm");
}

export async function loadCrmLeadDetailAction(
  leadId: string,
): Promise<CrmLeadDetail> {
  const { ctx } = await tenantRepo();
  const detail = await getTenantLeadDetail(
    ctx.schemaName,
    ctx.organizationId,
    leadId,
  );
  if (!detail) throw new Error("Lead não encontrado");
  return detail;
}

export async function loadCrmLeadDuplicatesAction(
  leadId: string,
): Promise<CrmLeadDuplicate[]> {
  const { ctx } = await tenantRepo();
  return findTenantLeadDuplicates(ctx.schemaName, leadId);
}

export async function checkNewLeadDuplicatesAction(input: {
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
}): Promise<CrmLeadDuplicate[]> {
  const { ctx } = await tenantRepo();
  return findDuplicatesForNewLead(ctx.schemaName, input);
}

export async function listCrmOwnersAction(): Promise<
  { userId: string; name: string }[]
> {
  const { ctx } = await tenantRepo();
  return listTenantCrmOwners(ctx.organizationId);
}

export async function updateCrmLeadAction(
  leadId: string,
  input: UpdateLeadInput,
) {
  const { ctx } = await requireCrmEditor();
  await updateTenantLead(ctx.schemaName, leadId, input);
  await emitAndPersist({
    type: "crm.lead.atualizado",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { leadId },
  });
  revalidatePath("/crm");
}

export async function mergeCrmLeadsAction(
  targetLeadId: string,
  sourceLeadId: string,
) {
  const { ctx } = await requireCrmEditor();
  await mergeTenantLeads(ctx.schemaName, targetLeadId, sourceLeadId);
  await emitAndPersist({
    type: "crm.lead.mesclado",
    organizationId: ctx.organizationId,
    schemaName: ctx.schemaName,
    payload: { targetLeadId, sourceLeadId },
  });
  revalidatePath("/crm");
}
