import { randomUUID } from "node:crypto";
import type {
  CreateTicketInput,
  HelpdeskQueue,
  HelpdeskTicketComment,
  HelpdeskTicketDetail,
  HelpdeskTicketPriority,
  HelpdeskTicketStatus,
  HelpdeskTicketSummary,
} from "@boilerplate/crm-helpdesk";
import { prisma } from "../client";
import { listOrganizationMembers } from "../membership-sectors";
import { assertSafeSchemaName } from "../tenant/schema";
import { ensureTenantHelpdeskTables } from "./ensure-tables";
import { computeSlaDueAt, isSlaBreached } from "./sla";
import { reindexHelpdeskKbEntry, searchHelpdeskKb } from "./kb-search";

export { ensureTenantHelpdeskTables, searchHelpdeskKb, reindexHelpdeskKbEntry };

function tTickets(schema: string): string {
  return `"${schema}"."crm_helpdesk_tickets"`;
}
function tComments(schema: string): string {
  return `"${schema}"."crm_helpdesk_ticket_comments"`;
}
function tQueues(schema: string): string {
  return `"${schema}"."crm_helpdesk_queues"`;
}
function tLinks(schema: string): string {
  return `"${schema}"."crm_helpdesk_ticket_kb_links"`;
}
function tKb(schema: string): string {
  return `"${schema}"."crm_helpdesk_kb_entries"`;
}
function tSla(schema: string): string {
  return `"${schema}"."crm_helpdesk_sla_policies"`;
}
function tSeq(schema: string): string {
  return `"${schema}"."crm_helpdesk_ticket_seq"`;
}

type TicketRow = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  requester_membership_id: string | null;
  affected_sector_id: string | null;
  assignee_membership_id: string | null;
  queue_id: string | null;
  sla_due_at: Date | null;
  first_response_at: Date | null;
  resolved_at: Date | null;
  closed_at: Date | null;
  platform_comms_thread_id: string | null;
  created_at: Date;
  updated_at: Date;
};

async function nextTicketNumber(schemaName: string): Promise<number> {
  const seq = tSeq(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ last_number: number }[]>(
    `UPDATE ${seq} SET last_number = last_number + 1 WHERE id = 'default' RETURNING last_number`,
  );
  return rows[0]?.last_number ?? 1;
}

async function loadMemberLabels(
  organizationId: string,
): Promise<Map<string, string>> {
  const members = await listOrganizationMembers(organizationId);
  const map = new Map<string, string>();
  for (const m of members) {
    map.set(m.membershipId, m.name || m.email);
  }
  return map;
}

async function loadSectorNames(
  organizationId: string,
): Promise<Map<string, string>> {
  const sectors = await prisma.sector.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });
  return new Map(sectors.map((s) => [s.id, s.name]));
}

function mapSummary(
  row: TicketRow,
  labels: Map<string, string>,
  sectorNames: Map<string, string>,
  queueName: string | null,
): HelpdeskTicketSummary {
  const slaDue = row.sla_due_at?.toISOString() ?? null;
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    status: row.status as HelpdeskTicketStatus,
    priority: row.priority as HelpdeskTicketPriority,
    queueId: row.queue_id,
    queueName,
    requesterMembershipId: row.requester_membership_id,
    requesterLabel: row.requester_membership_id
      ? labels.get(row.requester_membership_id) ?? "—"
      : null,
    affectedSectorId: row.affected_sector_id,
    affectedSectorName: row.affected_sector_id
      ? sectorNames.get(row.affected_sector_id) ?? "—"
      : null,
    assigneeMembershipId: row.assignee_membership_id,
    assigneeLabel: row.assignee_membership_id
      ? labels.get(row.assignee_membership_id) ?? "—"
      : null,
    slaDueAt: slaDue,
    slaBreached: isSlaBreached(row.sla_due_at, row.status),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listHelpdeskTickets(
  schemaName: string,
  organizationId: string,
  filters?: {
    status?: HelpdeskTicketStatus;
    queueId?: string;
    assigneeMembershipId?: string;
    affectedSectorId?: string;
    mineMembershipId?: string;
  },
): Promise<HelpdeskTicketSummary[]> {
  await ensureTenantHelpdeskTables(schemaName);
  const table = tTickets(schemaName);
  const queues = tQueues(schemaName);

  const clauses: string[] = ["1=1"];
  const params: unknown[] = [];
  let n = 1;

  if (filters?.status) {
    clauses.push(`t.status = $${n++}`);
    params.push(filters.status);
  }
  if (filters?.queueId) {
    clauses.push(`t.queue_id = $${n++}`);
    params.push(filters.queueId);
  }
  if (filters?.assigneeMembershipId) {
    clauses.push(`t.assignee_membership_id = $${n++}`);
    params.push(filters.assigneeMembershipId);
  }
  if (filters?.affectedSectorId) {
    clauses.push(`t.affected_sector_id = $${n++}`);
    params.push(filters.affectedSectorId);
  }
  if (filters?.mineMembershipId) {
    clauses.push(
      `(t.assignee_membership_id = $${n} OR t.requester_membership_id = $${n})`,
    );
    n++;
    params.push(filters.mineMembershipId);
  }

  const rows = await prisma.$queryRawUnsafe<
    (TicketRow & { queue_name: string | null })[]
  >(
    `SELECT t.*, q.name AS queue_name
     FROM ${table} t
     LEFT JOIN ${queues} q ON q.id = t.queue_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY t.number DESC`,
    ...params,
  );

  const [labels, sectorNames] = await Promise.all([
    loadMemberLabels(organizationId),
    loadSectorNames(organizationId),
  ]);

  return rows.map((r) =>
    mapSummary(r, labels, sectorNames, r.queue_name),
  );
}

export async function getHelpdeskTicket(
  schemaName: string,
  organizationId: string,
  ticketId: string,
): Promise<HelpdeskTicketDetail | null> {
  await ensureTenantHelpdeskTables(schemaName);
  const table = tTickets(schemaName);
  const queues = tQueues(schemaName);

  const rows = await prisma.$queryRawUnsafe<
    (TicketRow & { queue_name: string | null })[]
  >(
    `SELECT t.*, q.name AS queue_name
     FROM ${table} t
     LEFT JOIN ${queues} q ON q.id = t.queue_id
     WHERE t.id = $1`,
    ticketId,
  );
  const row = rows[0];
  if (!row) return null;

  const [labels, sectorNames, comments, kbLinks] = await Promise.all([
    loadMemberLabels(organizationId),
    loadSectorNames(organizationId),
    listTicketComments(schemaName, ticketId, organizationId),
    listTicketKbLinks(schemaName, ticketId),
  ]);

  const summary = mapSummary(row, labels, sectorNames, row.queue_name);
  return {
    ...summary,
    description: row.description,
    firstResponseAt: row.first_response_at?.toISOString() ?? null,
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    closedAt: row.closed_at?.toISOString() ?? null,
    platformCommsThreadId: row.platform_comms_thread_id,
    comments,
    kbLinks,
  };
}

async function listTicketComments(
  schemaName: string,
  ticketId: string,
  organizationId: string,
): Promise<HelpdeskTicketComment[]> {
  const table = tComments(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      body: string;
      visibility: string;
      author_membership_id: string | null;
      created_at: Date;
    }[]
  >(
    `SELECT * FROM ${table} WHERE ticket_id = $1 ORDER BY created_at ASC`,
    ticketId,
  );
  const labels = await loadMemberLabels(organizationId);
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    visibility: r.visibility as "internal" | "requester",
    authorMembershipId: r.author_membership_id,
    authorLabel: r.author_membership_id
      ? labels.get(r.author_membership_id) ?? "Sistema"
      : "Sistema",
    createdAt: r.created_at.toISOString(),
  }));
}

async function listTicketKbLinks(schemaName: string, ticketId: string) {
  const links = tLinks(schemaName);
  const kb = tKb(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    { kb_entry_id: string; title: string; link_type: string }[]
  >(
    `SELECT l.kb_entry_id, e.title, l.link_type
     FROM ${links} l
     JOIN ${kb} e ON e.id = l.kb_entry_id
     WHERE l.ticket_id = $1`,
    ticketId,
  );
  return rows.map((r) => ({
    kbEntryId: r.kb_entry_id,
    title: r.title,
    linkType: r.link_type as "suggested" | "manual" | "resolved_from",
  }));
}

async function getDefaultSlaPolicy(schemaName: string) {
  const table = tSla(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      first_response_minutes: Record<string, number>;
      resolution_minutes: Record<string, number>;
    }[]
  >(`SELECT id, first_response_minutes, resolution_minutes FROM ${table}
     WHERE active = true ORDER BY created_at ASC LIMIT 1`);
  return rows[0] ?? null;
}

async function getDefaultQueueId(schemaName: string): Promise<string | null> {
  const table = tQueues(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${table} WHERE is_default = true LIMIT 1`,
  );
  return rows[0]?.id ?? null;
}

export async function createHelpdeskTicket(
  schemaName: string,
  input: CreateTicketInput & {
    createdByMembershipId?: string | null;
    platformCommsThreadId?: string | null;
  },
): Promise<string> {
  await ensureTenantHelpdeskTables(schemaName);
  const id = randomUUID();
  const number = await nextTicketNumber(schemaName);
  const priority = input.priority ?? "medium";
  const policy = await getDefaultSlaPolicy(schemaName);
  const queueId =
    input.queueId ?? (await getDefaultQueueId(schemaName));
  const slaDueAt = policy
    ? computeSlaDueAt(priority, policy)
  : null;

  const table = tTickets(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table}
      (id, number, title, description, priority, requester_membership_id,
       affected_sector_id, assignee_membership_id, queue_id, sla_policy_id,
       sla_due_at, platform_comms_thread_id, created_by_membership_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    id,
    number,
    input.title.trim(),
    input.description.trim(),
    priority,
    input.requesterMembershipId ?? null,
    input.affectedSectorId ?? null,
    input.assigneeMembershipId ?? null,
    queueId,
    policy?.id ?? null,
    slaDueAt,
    input.platformCommsThreadId ?? null,
    input.createdByMembershipId ?? null,
  );

  if (input.suggestedKbEntryIds?.length) {
    await linkKbToTicket(
      schemaName,
      id,
      input.suggestedKbEntryIds,
      "suggested",
    );
  }

  return id;
}

export async function linkKbToTicket(
  schemaName: string,
  ticketId: string,
  kbEntryIds: string[],
  linkType: "suggested" | "manual" | "resolved_from",
): Promise<void> {
  const table = tLinks(schemaName);
  for (const kbId of kbEntryIds) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${table} (ticket_id, kb_entry_id, link_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (ticket_id, kb_entry_id) DO UPDATE SET link_type = $3`,
      ticketId,
      kbId,
      linkType,
    );
  }
}

export async function addTicketComment(
  schemaName: string,
  input: {
    ticketId: string;
    body: string;
    visibility?: "internal" | "requester";
    authorMembershipId?: string | null;
  },
): Promise<void> {
  const table = tComments(schemaName);
  const tickets = tTickets(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (id, ticket_id, body, visibility, author_membership_id)
     VALUES ($1, $2, $3, $4, $5)`,
    randomUUID(),
    input.ticketId,
    input.body.trim(),
    input.visibility ?? "internal",
    input.authorMembershipId ?? null,
  );

  const now = new Date();
  await prisma.$executeRawUnsafe(
    `UPDATE ${tickets}
     SET updated_at = $2,
         first_response_at = COALESCE(first_response_at, $2)
     WHERE id = $1`,
    input.ticketId,
    now,
  );
}

export async function updateHelpdeskTicket(
  schemaName: string,
  ticketId: string,
  patch: {
    status?: HelpdeskTicketStatus;
    priority?: HelpdeskTicketPriority;
    assigneeMembershipId?: string | null;
    queueId?: string | null;
  },
): Promise<void> {
  const table = tTickets(schemaName);
  const sets: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [ticketId];
  let n = 2;

  if (patch.status) {
    sets.push(`status = $${n++}`);
    params.push(patch.status);
    if (patch.status === "resolved") {
      sets.push(`resolved_at = COALESCE(resolved_at, NOW())`);
    }
    if (patch.status === "closed") {
      sets.push(`closed_at = COALESCE(closed_at, NOW())`);
    }
  }
  if (patch.priority) {
    sets.push(`priority = $${n++}`);
    params.push(patch.priority);
  }
  if (patch.assigneeMembershipId !== undefined) {
    sets.push(`assignee_membership_id = $${n++}`);
    params.push(patch.assigneeMembershipId);
  }
  if (patch.queueId !== undefined) {
    sets.push(`queue_id = $${n++}`);
    params.push(patch.queueId);
  }

  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $1`,
    ...params,
  );
}

export async function listHelpdeskQueues(
  schemaName: string,
): Promise<HelpdeskQueue[]> {
  await ensureTenantHelpdeskTables(schemaName);
  const table = tQueues(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    { id: string; name: string; sector_id: string | null; is_default: boolean }[]
  >(`SELECT id, name, sector_id, is_default FROM ${table} ORDER BY name`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sectorId: r.sector_id,
    isDefault: r.is_default,
  }));
}

export async function suggestKbForTicketText(
  schemaName: string,
  title: string,
  description: string,
  sectorId?: string | null,
): Promise<{ kbEntryId: string; title: string; snippet: string; score: number }[]> {
  const query = `${title}\n${description}`.slice(0, 500);
  return searchHelpdeskKb(schemaName, query, {
    limit: 5,
    sectorId: sectorId ?? undefined,
  });
}
