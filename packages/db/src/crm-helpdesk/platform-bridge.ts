import { prisma } from "../client";
import {
  createHelpdeskTicket,
  ensureTenantHelpdeskTables,
  getHelpdeskTicket,
} from "./repository";

export async function createTicketFromCommsThread(
  threadId: string,
  input: {
    title: string;
    description: string;
    createdByPlatformUserId?: string | null;
  },
): Promise<{ ticketId: string; organizationId: string } | null> {
  const thread = await prisma.platformCommsThread.findUnique({
    where: { id: threadId },
    include: { organization: true },
  });
  if (!thread?.organizationId || !thread.organization?.schemaName) {
    return null;
  }

  const schemaName = thread.organization.schemaName;
  await ensureTenantHelpdeskTables(schemaName);

  const ticketId = await createHelpdeskTicket(schemaName, {
    title: input.title,
    description: input.description,
    platformCommsThreadId: threadId,
    priority: "medium",
  });

  await prisma.$executeRawUnsafe(
    `UPDATE boilerplate.platform_comms_threads
     SET helpdesk_ticket_id = $1, helpdesk_ticket_org_id = $2, updated_at = NOW()
     WHERE id = $3`,
    ticketId,
    thread.organizationId,
    threadId,
  );

  return { ticketId, organizationId: thread.organizationId };
}

export async function linkCommsThreadToTicket(
  threadId: string,
  organizationId: string,
  ticketId: string,
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { schemaName: true },
  });
  if (!org?.schemaName) return false;

  const ticket = await getHelpdeskTicket(
    org.schemaName,
    organizationId,
    ticketId,
  );
  if (!ticket) return false;

  await prisma.$executeRawUnsafe(
    `UPDATE boilerplate.platform_comms_threads
     SET helpdesk_ticket_id = $1, helpdesk_ticket_org_id = $2, updated_at = NOW()
     WHERE id = $3`,
    ticketId,
    organizationId,
    threadId,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE "${org.schemaName}"."crm_helpdesk_tickets"
     SET platform_comms_thread_id = $2, updated_at = NOW()
     WHERE id = $1`,
    ticketId,
    threadId,
  );

  return true;
}

export type PlatformHelpdeskOrgSummary = {
  organizationId: string;
  organizationName: string;
  openTickets: number;
  slaBreached: number;
  csatAverage: number | null;
};

export async function aggregatePlatformHelpdeskStats(): Promise<{
  organizations: PlatformHelpdeskOrgSummary[];
  totalOpen: number;
  totalSlaBreached: number;
}> {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, schemaName: true },
  });

  const organizations: PlatformHelpdeskOrgSummary[] = [];
  let totalOpen = 0;
  let totalSlaBreached = 0;

  for (const org of orgs) {
    if (!org.schemaName) continue;
    try {
      await ensureTenantHelpdeskTables(org.schemaName);
      const tickets = `"${org.schemaName}"."crm_helpdesk_tickets"`;
      const csat = `"${org.schemaName}"."crm_helpdesk_csat_responses"`;

      const counts = await prisma.$queryRawUnsafe<
        { open_count: bigint; breached_count: bigint }[]
      >(
        `SELECT
           COUNT(*) FILTER (WHERE status NOT IN ('closed','resolved'))::bigint AS open_count,
           COUNT(*) FILTER (
             WHERE status NOT IN ('closed','resolved')
               AND sla_due_at IS NOT NULL AND sla_due_at < NOW()
           )::bigint AS breached_count
         FROM ${tickets}`,
      );
      const open = Number(counts[0]?.open_count ?? 0);
      const breached = Number(counts[0]?.breached_count ?? 0);
      if (open === 0 && breached === 0) continue;

      const avgRows = await prisma.$queryRawUnsafe<{ avg: number | null }[]>(
        `SELECT AVG(score)::float AS avg FROM ${csat}`,
      );
      const csatAverage = avgRows[0]?.avg ?? null;

      organizations.push({
        organizationId: org.id,
        organizationName: org.name,
        openTickets: open,
        slaBreached: breached,
        csatAverage:
          csatAverage == null ? null : Math.round(csatAverage * 10) / 10,
      });
      totalOpen += open;
      totalSlaBreached += breached;
    } catch {
      // schema sem helpdesk ainda
    }
  }

  return { organizations, totalOpen, totalSlaBreached };
}
