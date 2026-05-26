"use server";

import { emitAndPersist } from "@/lib/events/emit";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { requireTenantContext } from "@/lib/tenant-context";
import type {
  CreateKbArticleInput,
  CreateKbThreadInput,
  CreateTicketInput,
  HelpdeskKbEntryDetail,
  HelpdeskKbEntrySummary,
  HelpdeskKbSearchHit,
  HelpdeskQueue,
  HelpdeskTicketDetail,
  HelpdeskTicketPriority,
  HelpdeskTicketStatus,
  HelpdeskTicketSummary,
} from "@boilerplate/crm-helpdesk";
import {
  addKbThreadPost,
  addTicketComment,
  createHelpdeskKbArticle,
  createHelpdeskKbThread,
  createHelpdeskTicket,
  getHelpdeskKbEntry,
  getHelpdeskTicket,
  linkKbToTicket,
  listHelpdeskKbEntries,
  listHelpdeskQueues,
  listHelpdeskTickets,
  listOrganizationMembers,
  publishHelpdeskKbEntry,
  runHelpdeskAutomations,
  searchHelpdeskKb,
  submitHelpdeskCsat,
  suggestKbForTicketText,
  updateHelpdeskTicket,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

async function ctx() {
  return requireTenantContext();
}

function assertRead(role: string) {
  if (!roleHasModulePermission(role, "crm-helpdesk", "ver")) {
    throw new Error("Sem permissão para o Help Desk");
  }
}

function assertWrite(role: string) {
  if (!roleHasModulePermission(role, "crm-helpdesk", "editar")) {
    throw new Error("Sem permissão para editar tickets");
  }
}

export async function listHelpdeskTicketsAction(filters?: {
  status?: HelpdeskTicketStatus;
  queueId?: string;
  mineOnly?: boolean;
  affectedSectorId?: string;
}): Promise<HelpdeskTicketSummary[]> {
  const c = await ctx();
  assertRead(c.role);
  return listHelpdeskTickets(c.schemaName, c.organizationId, {
    status: filters?.status,
    queueId: filters?.queueId,
    affectedSectorId: filters?.affectedSectorId,
    mineMembershipId: filters?.mineOnly ? c.membershipId : undefined,
  });
}

export async function getHelpdeskTicketAction(
  ticketId: string,
): Promise<HelpdeskTicketDetail | null> {
  const c = await ctx();
  assertRead(c.role);
  return getHelpdeskTicket(c.schemaName, c.organizationId, ticketId);
}

export async function listHelpdeskQueuesAction(): Promise<HelpdeskQueue[]> {
  const c = await ctx();
  assertRead(c.role);
  return listHelpdeskQueues(c.schemaName);
}

export async function listHelpdeskMembersAction(): Promise<
  { membershipId: string; name: string }[]
> {
  const c = await ctx();
  assertRead(c.role);
  const members = await listOrganizationMembers(c.organizationId);
  return members.map((m) => ({
    membershipId: m.membershipId,
    name: m.name || m.email,
  }));
}

export async function listHelpdeskSectorsAction(): Promise<
  { id: string; name: string }[]
> {
  const c = await ctx();
  assertRead(c.role);
  const { listSectors } = await import("@boilerplate/db");
  const sectors = await listSectors(c.organizationId);
  return sectors.map((s) => ({ id: s.id, name: s.name }));
}

export async function createHelpdeskTicketAction(input: CreateTicketInput) {
  const c = await ctx();
  assertWrite(c.role);
  const ticketId = await createHelpdeskTicket(c.schemaName, {
    ...input,
    requesterMembershipId:
      input.requesterMembershipId ?? c.membershipId,
    createdByMembershipId: c.membershipId,
  });
  await runHelpdeskAutomations(c.schemaName, "ticket.created", {
    ticketId,
    title: input.title,
    description: input.description,
    affectedSectorId: input.affectedSectorId,
  });
  await emitAndPersist({
    type: "crm-helpdesk.ticket.created",
    organizationId: c.organizationId,
    schemaName: c.schemaName,
    payload: { ticketId, title: input.title },
  });
  revalidatePath("/helpdesk");
  return ticketId;
}

export async function updateHelpdeskTicketAction(
  ticketId: string,
  patch: {
    status?: HelpdeskTicketStatus;
    priority?: HelpdeskTicketPriority;
    assigneeMembershipId?: string | null;
    queueId?: string | null;
  },
) {
  const c = await ctx();
  assertWrite(c.role);
  const prev = await getHelpdeskTicket(c.schemaName, c.organizationId, ticketId);
  await updateHelpdeskTicket(c.schemaName, ticketId, patch);

  if (patch.assigneeMembershipId && patch.assigneeMembershipId !== prev?.assigneeMembershipId) {
    await emitAndPersist({
      type: "crm-helpdesk.ticket.assigned",
      organizationId: c.organizationId,
      schemaName: c.schemaName,
      payload: { ticketId, assigneeMembershipId: patch.assigneeMembershipId },
    });
  }
  if (patch.status === "resolved" && prev?.status !== "resolved") {
    await runHelpdeskAutomations(c.schemaName, "ticket.resolved", {
      ticketId,
      title: prev?.title,
      description: prev?.description,
      affectedSectorId: prev?.affectedSectorId,
    });
    await emitAndPersist({
      type: "crm-helpdesk.ticket.resolved",
      organizationId: c.organizationId,
      schemaName: c.schemaName,
      payload: { ticketId },
    });
  }
  if (patch.status === "closed" && prev?.status !== "closed") {
    await runHelpdeskAutomations(c.schemaName, "ticket.closed", { ticketId });
    await emitAndPersist({
      type: "crm-helpdesk.ticket.closed",
      organizationId: c.organizationId,
      schemaName: c.schemaName,
      payload: { ticketId },
    });
    await emitAndPersist({
      type: "crm.ticket.encerrado",
      organizationId: c.organizationId,
      schemaName: c.schemaName,
      payload: { ticketId },
    });
  }
  revalidatePath("/helpdesk");
  revalidatePath(`/helpdesk/tickets/${ticketId}`);
}

export async function addHelpdeskCommentAction(
  ticketId: string,
  body: string,
  visibility: "internal" | "requester" = "internal",
) {
  const c = await ctx();
  assertWrite(c.role);
  await addTicketComment(c.schemaName, {
    ticketId,
    body,
    visibility,
    authorMembershipId: c.membershipId,
  });
  revalidatePath(`/helpdesk/tickets/${ticketId}`);
}

export async function linkHelpdeskKbAction(
  ticketId: string,
  kbEntryIds: string[],
  linkType: "manual" | "resolved_from" = "manual",
) {
  const c = await ctx();
  assertWrite(c.role);
  await linkKbToTicket(c.schemaName, ticketId, kbEntryIds, linkType);
  revalidatePath(`/helpdesk/tickets/${ticketId}`);
}

export async function suggestHelpdeskKbAction(
  title: string,
  description: string,
  sectorId?: string | null,
): Promise<HelpdeskKbSearchHit[]> {
  const c = await ctx();
  assertRead(c.role);
  return suggestKbForTicketText(c.schemaName, title, description, sectorId);
}

export async function searchHelpdeskKbAction(
  query: string,
  sectorId?: string | null,
): Promise<HelpdeskKbSearchHit[]> {
  const c = await ctx();
  assertRead(c.role);
  return searchHelpdeskKb(c.schemaName, query, {
    limit: 8,
    sectorId: sectorId ?? undefined,
  });
}

export async function listHelpdeskKbAction(
  status?: "draft" | "published",
): Promise<HelpdeskKbEntrySummary[]> {
  const c = await ctx();
  assertRead(c.role);
  return listHelpdeskKbEntries(c.schemaName, status);
}

export async function getHelpdeskKbAction(
  kbEntryId: string,
): Promise<HelpdeskKbEntryDetail | null> {
  const c = await ctx();
  assertRead(c.role);
  return getHelpdeskKbEntry(c.schemaName, c.organizationId, kbEntryId);
}

export async function createHelpdeskKbArticleAction(input: CreateKbArticleInput) {
  const c = await ctx();
  assertWrite(c.role);
  const id = await createHelpdeskKbArticle(c.schemaName, {
    ...input,
    authorMembershipId: c.membershipId,
  });
  if (input.publish) {
    await emitAndPersist({
      type: "crm-helpdesk.kb.published",
      organizationId: c.organizationId,
      schemaName: c.schemaName,
      payload: { kbEntryId: id },
    });
  }
  revalidatePath("/helpdesk/kb");
  return id;
}

export async function createHelpdeskKbThreadAction(input: CreateKbThreadInput) {
  const c = await ctx();
  assertWrite(c.role);
  const id = await createHelpdeskKbThread(c.schemaName, {
    ...input,
    authorMembershipId: c.membershipId,
  });
  if (input.publish) {
    await emitAndPersist({
      type: "crm-helpdesk.kb.published",
      organizationId: c.organizationId,
      schemaName: c.schemaName,
      payload: { kbEntryId: id },
    });
  }
  revalidatePath("/helpdesk/kb");
  return id;
}

export async function addHelpdeskKbPostAction(
  kbEntryId: string,
  body: string,
  isAcceptedSolution?: boolean,
) {
  const c = await ctx();
  assertWrite(c.role);
  await addKbThreadPost(c.schemaName, kbEntryId, {
    body,
    authorMembershipId: c.membershipId,
    isAcceptedSolution,
  });
  revalidatePath(`/helpdesk/kb/${kbEntryId}`);
}

export async function publishHelpdeskKbAction(kbEntryId: string) {
  const c = await ctx();
  assertWrite(c.role);
  await publishHelpdeskKbEntry(c.schemaName, kbEntryId);
  await emitAndPersist({
    type: "crm-helpdesk.kb.published",
    organizationId: c.organizationId,
    schemaName: c.schemaName,
    payload: { kbEntryId },
  });
  revalidatePath("/helpdesk/kb");
  revalidatePath(`/helpdesk/kb/${kbEntryId}`);
}

export async function submitHelpdeskCsatAction(
  ticketId: string,
  score: number,
  comment?: string,
) {
  const c = await ctx();
  assertRead(c.role);
  await submitHelpdeskCsat(c.schemaName, { ticketId, score, comment });
  revalidatePath(`/helpdesk/tickets/${ticketId}`);
}

export async function helpdeskAprendizReplyAction(
  query: string,
  sectorId?: string | null,
): Promise<{ reply: string; hits: HelpdeskKbSearchHit[] }> {
  const c = await ctx();
  assertRead(c.role);
  const hits = await searchHelpdeskKb(c.schemaName, query, {
    limit: 5,
    sectorId: sectorId ?? undefined,
  });
  const { responderMensagemAprendizComHelpdesk } = await import(
    "@boilerplate/aprendiz-engine"
  );
  const reply = await responderMensagemAprendizComHelpdesk(query, { kbHits: hits });
  return { reply, hits };
}
