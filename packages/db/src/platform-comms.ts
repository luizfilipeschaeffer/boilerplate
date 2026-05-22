import { prisma } from "./client";
import type {
  CommsChannel,
  CommsDirection,
  CommsParticipantKind,
} from "./platform-comms-labels";

export type { CommsChannel, CommsDirection, CommsParticipantKind } from "./platform-comms-labels";
export { COMMS_CHANNEL_LABELS, COMMS_PARTICIPANT_LABELS } from "./platform-comms-labels";

export type CommsThreadSummary = {
  id: string;
  subject: string;
  channel: CommsChannel;
  status: string;
  lastMessageAt: Date | null;
  preview: string | null;
  organizationId: string | null;
  platformLeadId: string | null;
  recordTitle: string | null;
  recordKind: "organization" | "lead" | null;
  participantKind: CommsParticipantKind;
  peerPlatformUserId: string | null;
  peerName: string | null;
  peerEmail: string | null;
  peerRole: string | null;
  assignedPlatformUserId: string | null;
  messageCount: number;
};

export type CommsMessageRow = {
  id: string;
  direction: CommsDirection;
  body: string;
  fromLabel: string | null;
  toLabel: string | null;
  createdAt: Date;
};

export type CommsThreadDetail = CommsThreadSummary & {
  messages: CommsMessageRow[];
  tipoNegocio: string | null;
  phase: number | null;
  consents: { channel: string; consentedAt: Date; revokedAt: Date | null }[];
};

function asChannel(value: string): CommsChannel {
  if (
    value === "whatsapp" ||
    value === "telegram" ||
    value === "sms" ||
    value === "internal"
  ) {
    return value;
  }
  return "email";
}

function asParticipantKind(value: string): CommsParticipantKind {
  return value === "internal" ? "internal" : "client";
}

function displayTitle(t: {
  subject: string;
  participantKind: string;
  organization?: { name: string } | null;
  platformLead?: { name: string } | null;
  peerPlatformUser?: { name: string | null; email: string } | null;
}): string {
  if (asParticipantKind(t.participantKind) === "internal") {
    return (
      t.peerPlatformUser?.name?.trim() ||
      t.peerPlatformUser?.email ||
      t.subject
    );
  }
  return t.organization?.name ?? t.platformLead?.name ?? t.subject;
}

async function resolveRecordTitle(
  organizationId: string | null,
  platformLeadId: string | null,
): Promise<{ title: string | null; kind: "organization" | "lead" | null }> {
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    return { title: org?.name ?? null, kind: "organization" };
  }
  if (platformLeadId) {
    const lead = await prisma.platformLead.findUnique({
      where: { id: platformLeadId },
      select: { name: true },
    });
    return { title: lead?.name ?? null, kind: "lead" };
  }
  return { title: null, kind: null };
}

export async function listCommsThreads(filters?: {
  organizationId?: string;
  platformLeadId?: string;
  channel?: CommsChannel;
  participantKind?: CommsParticipantKind;
  status?: string;
}): Promise<CommsThreadSummary[]> {
  const threads = await prisma.platformCommsThread.findMany({
    where: {
      ...(filters?.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
      ...(filters?.platformLeadId
        ? { platformLeadId: filters.platformLeadId }
        : {}),
      ...(filters?.channel ? { channel: filters.channel } : {}),
      ...(filters?.participantKind
        ? { participantKind: filters.participantKind }
        : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
      organization: { select: { name: true } },
      platformLead: { select: { name: true } },
      peerPlatformUser: { select: { name: true, email: true, role: true } },
    },
  });

  return threads.map((t) => {
    const participantKind = asParticipantKind(t.participantKind);
    const title = displayTitle(t);
    return {
      id: t.id,
      subject: t.subject,
      channel: asChannel(t.channel),
      status: t.status,
      lastMessageAt: t.lastMessageAt,
      preview: t.messages[0]?.body.slice(0, 120) ?? null,
      organizationId: t.organizationId,
      platformLeadId: t.platformLeadId,
      recordTitle:
        participantKind === "internal"
          ? title
          : (t.organization?.name ?? t.platformLead?.name ?? null),
      recordKind: t.organizationId
        ? "organization"
        : t.platformLeadId
          ? "lead"
          : null,
      participantKind,
      peerPlatformUserId: t.peerPlatformUserId,
      peerName: t.peerPlatformUser?.name ?? null,
      peerEmail: t.peerPlatformUser?.email ?? null,
      peerRole: t.peerPlatformUser?.role ?? null,
      assignedPlatformUserId: t.assignedPlatformUserId,
      messageCount: t._count.messages,
    };
  });
}

export async function getCommsThread(
  threadId: string,
): Promise<CommsThreadDetail | null> {
  const t = await prisma.platformCommsThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      organization: {
        select: { name: true, tipoNegocio: true, phase: true },
      },
      platformLead: {
        select: { name: true, tipoNegocio: true, estimatedPhase: true },
      },
      peerPlatformUser: { select: { name: true, email: true, role: true } },
    },
  });
  if (!t) return null;
  const participantKind = asParticipantKind(t.participantKind);

  const consents = await prisma.platformCommsConsent.findMany({
    where: {
      OR: [
        ...(t.organizationId
          ? [{ organizationId: t.organizationId }]
          : []),
        ...(t.platformLeadId ? [{ platformLeadId: t.platformLeadId }] : []),
      ],
    },
    orderBy: { consentedAt: "desc" },
  });

  const title = displayTitle(t);

  return {
    id: t.id,
    subject: t.subject,
    channel: asChannel(t.channel),
    status: t.status,
    lastMessageAt: t.lastMessageAt,
    preview: t.messages.at(-1)?.body.slice(0, 120) ?? null,
    organizationId: t.organizationId,
    platformLeadId: t.platformLeadId,
    recordTitle:
      participantKind === "internal"
        ? title
        : (t.organization?.name ?? t.platformLead?.name ?? null),
    recordKind: t.organizationId
      ? "organization"
      : t.platformLeadId
        ? "lead"
        : null,
    participantKind,
    peerPlatformUserId: t.peerPlatformUserId,
    peerName: t.peerPlatformUser?.name ?? null,
    peerEmail: t.peerPlatformUser?.email ?? null,
    peerRole: t.peerPlatformUser?.role ?? null,
    assignedPlatformUserId: t.assignedPlatformUserId,
    messageCount: t.messages.length,
    messages: t.messages.map((m) => ({
      id: m.id,
      direction: m.direction as CommsDirection,
      body: m.body,
      fromLabel: m.fromLabel,
      toLabel: m.toLabel,
      createdAt: m.createdAt,
    })),
    tipoNegocio:
      t.organization?.tipoNegocio ?? t.platformLead?.tipoNegocio ?? null,
    phase: t.organization?.phase ?? t.platformLead?.estimatedPhase ?? null,
    consents: consents.map((c) => ({
      channel: c.channel,
      consentedAt: c.consentedAt,
      revokedAt: c.revokedAt,
    })),
  };
}

export async function createCommsThread(input: {
  subject: string;
  channel: CommsChannel;
  participantKind?: CommsParticipantKind;
  organizationId?: string | null;
  platformLeadId?: string | null;
  peerPlatformUserId?: string | null;
  assignedPlatformUserId?: string | null;
  initialBody?: string;
  fromLabel?: string;
  toLabel?: string;
}): Promise<string> {
  const participantKind =
    input.participantKind ??
    (input.peerPlatformUserId || input.channel === "internal"
      ? "internal"
      : "client");

  const thread = await prisma.platformCommsThread.create({
    data: {
      subject: input.subject,
      channel: input.channel,
      participantKind,
      organizationId: input.organizationId ?? null,
      platformLeadId: input.platformLeadId ?? null,
      peerPlatformUserId: input.peerPlatformUserId ?? null,
      assignedPlatformUserId: input.assignedPlatformUserId ?? null,
      status: "open",
    },
  });

  if (input.initialBody?.trim()) {
    await sendCommsMessage({
      threadId: thread.id,
      direction: "outbound",
      body: input.initialBody.trim(),
      fromLabel: input.fromLabel ?? "Plataforma",
      toLabel: input.toLabel,
      platformUserId: input.assignedPlatformUserId,
    });
  }

  return thread.id;
}

export async function sendCommsMessage(input: {
  threadId: string;
  direction: CommsDirection;
  body: string;
  fromLabel?: string;
  toLabel?: string;
  platformUserId?: string | null;
}): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.platformCommsMessage.create({
      data: {
        threadId: input.threadId,
        direction: input.direction,
        body: input.body,
        fromLabel: input.fromLabel ?? null,
        toLabel: input.toLabel ?? null,
      },
    }),
    prisma.platformCommsThread.update({
      where: { id: input.threadId },
      data: { lastMessageAt: now, status: "open", updatedAt: now },
    }),
  ]);

  const thread = await prisma.platformCommsThread.findUnique({
    where: { id: input.threadId },
    select: {
      organizationId: true,
      platformLeadId: true,
      channel: true,
    },
  });

  if (thread) {
    await prisma.platformActivity.create({
      data: {
        activityType: "message",
        body: input.body.slice(0, 500),
        commsThreadId: input.threadId,
        organizationId: thread.organizationId,
        platformLeadId: thread.platformLeadId,
        platformUserId: input.platformUserId ?? null,
      },
    });
  }
}

export async function registerCommsConsent(input: {
  channel: CommsChannel;
  organizationId?: string | null;
  platformLeadId?: string | null;
  platformContactId?: string | null;
}): Promise<void> {
  await prisma.platformCommsConsent.create({
    data: {
      channel: input.channel,
      organizationId: input.organizationId ?? null,
      platformLeadId: input.platformLeadId ?? null,
      platformContactId: input.platformContactId ?? null,
    },
  });
}

export async function ensurePlatformAccountForRecord(input: {
  organizationId?: string;
  platformLeadId?: string;
  name: string;
}): Promise<string> {
  if (input.organizationId) {
    const existing = await prisma.platformAccount.findUnique({
      where: { organizationId: input.organizationId },
    });
    if (existing) return existing.id;
    const acc = await prisma.platformAccount.create({
      data: {
        name: input.name,
        organizationId: input.organizationId,
      },
    });
    return acc.id;
  }
  if (input.platformLeadId) {
    const existing = await prisma.platformAccount.findUnique({
      where: { platformLeadId: input.platformLeadId },
    });
    if (existing) return existing.id;
    const acc = await prisma.platformAccount.create({
      data: {
        name: input.name,
        platformLeadId: input.platformLeadId,
      },
    });
    return acc.id;
  }
  throw new Error("Informe organizationId ou platformLeadId");
}

export async function linkLeadToOrganization(
  platformLeadId: string,
  organizationId: string,
): Promise<void> {
  const [lead, org] = await Promise.all([
    prisma.platformLead.findUnique({ where: { id: platformLeadId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
  ]);
  if (!lead || !org) throw new Error("Lead ou organização não encontrados");

  await prisma.$transaction(async (tx) => {
    await tx.platformCommsThread.updateMany({
      where: { platformLeadId },
      data: { organizationId, platformLeadId: null },
    });
    await tx.platformActivity.updateMany({
      where: { platformLeadId },
      data: { organizationId, platformLeadId: null },
    });
    await tx.platformCrmNote.updateMany({
      where: { platformLeadId },
      data: { organizationId, platformLeadId: null },
    });
    await tx.platformCommsConsent.updateMany({
      where: { platformLeadId },
      data: { organizationId, platformLeadId: null },
    });
    await tx.platformContact.updateMany({
      where: { platformLeadId },
      data: { platformLeadId: null, platformAccountId: null },
    });

    const acc = await tx.platformAccount.upsert({
      where: { organizationId },
      create: { name: org.name, organizationId },
      update: { name: org.name },
    });

    await tx.platformAccount.deleteMany({
      where: { platformLeadId },
    });

    await tx.crmDeal.updateMany({
      where: { platformLeadId },
      data: {
        organizationId,
        platformLeadId: null,
        platformAccountId: acc.id,
      },
    });

    await tx.platformLead.update({
      where: { id: platformLeadId },
      data: { crmStage: "trial" },
    });
  });
}
