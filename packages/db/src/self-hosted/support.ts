import type { Prisma } from "../generated/prisma";
import type { CreateSupportTicketRequest, SupportTicket } from "@boilerplate/platform-api";
import { prisma } from "../client";

export async function createSupportTicket(
  req: CreateSupportTicketRequest,
  createdByUserId?: string,
): Promise<SupportTicket> {
  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId: req.organizationId,
      installationId: req.installationId,
      createdByUserId,
      moduleId: req.moduleId,
      integratorId: req.integratorId,
      type: req.type,
      priority: req.priority ?? "medium",
      subject: req.subject,
      sanitizedContext: (req.sanitizedContext ?? {}) as Prisma.InputJsonValue,
    },
  });
  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorType: "customer",
      authorId: createdByUserId,
      body: req.body,
      sanitized: true,
    },
  });
  return mapTicket(ticket);
}

function mapTicket(t: {
  id: string;
  organizationId: string;
  installationId: string;
  moduleId: string | null;
  integratorId: string | null;
  type: string;
  status: string;
  priority: string;
  sanitizedContext: unknown;
  subject: string;
  createdAt: Date;
  updatedAt: Date;
}): SupportTicket {
  return {
    id: t.id,
    organizationId: t.organizationId,
    installationId: t.installationId,
    moduleId: t.moduleId ?? undefined,
    integratorId: t.integratorId ?? undefined,
    type: t.type as SupportTicket["type"],
    status: t.status as SupportTicket["status"],
    priority: t.priority as SupportTicket["priority"],
    sanitizedContext: (t.sanitizedContext as Record<string, unknown>) ?? {},
    subject: t.subject,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function listSupportTicketsForInstallation(
  installationId: string,
): Promise<SupportTicket[]> {
  const rows = await prisma.supportTicket.findMany({
    where: { installationId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapTicket);
}

export async function listAllSupportTickets() {
  return prisma.supportTicket.findMany({
    include: {
      organization: { select: { name: true, slug: true } },
      installation: { select: { name: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function addSupportTicketReply(opts: {
  ticketId: string;
  authorType: string;
  authorId?: string;
  body: string;
}) {
  await prisma.supportTicketMessage.create({
    data: {
      ticketId: opts.ticketId,
      authorType: opts.authorType,
      authorId: opts.authorId,
      body: opts.body,
      sanitized: true,
    },
  });
  await prisma.supportTicket.update({
    where: { id: opts.ticketId },
    data: { updatedAt: new Date() },
  });
}
