import type { CrmRecordKind } from "@boilerplate/crm";
import { prisma } from "./client";

export type PlatformContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
};

export type PlatformActivityRow = {
  id: string;
  activityType: string;
  body: string;
  createdAt: Date;
  authorName: string | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  note: "Nota",
  call: "Ligação",
  meeting: "Reunião",
  message: "Mensagem",
};

export function activityTypeLabel(type: string): string {
  return ACTIVITY_LABELS[type] ?? type;
}

export async function listContactsForRecord(
  id: string,
  kind: CrmRecordKind,
): Promise<PlatformContactRow[]> {
  if (kind === "lead") {
    const rows = await prisma.platformContact.findMany({
      where: { platformLeadId: id },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapContact);
  }

  const account = await prisma.platformAccount.findUnique({
    where: { organizationId: id },
  });
  if (!account) return [];
  const rows = await prisma.platformContact.findMany({
    where: { platformAccountId: account.id },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapContact);
}

function mapContact(c: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}): PlatformContactRow {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role,
  };
}

export async function addContactForRecord(
  id: string,
  kind: CrmRecordKind,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  },
): Promise<void> {
  const accountId =
    kind === "organization"
      ? (
          await prisma.platformAccount.upsert({
            where: { organizationId: id },
            create: {
              name:
                (
                  await prisma.organization.findUnique({
                    where: { id },
                    select: { name: true },
                  })
                )?.name ?? "Conta",
              organizationId: id,
            },
            update: {},
          })
        ).id
      : (
          await prisma.platformAccount.upsert({
            where: { platformLeadId: id },
            create: {
              name:
                (
                  await prisma.platformLead.findUnique({
                    where: { id },
                    select: { name: true },
                  })
                )?.name ?? "Lead",
              platformLeadId: id,
            },
            update: {},
          })
        ).id;

  await prisma.platformContact.create({
    data: {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      role: input.role ?? null,
      platformAccountId: accountId,
      platformLeadId: kind === "lead" ? id : null,
    },
  });
}

export async function listActivitiesForRecord(
  id: string,
  kind: CrmRecordKind,
): Promise<PlatformActivityRow[]> {
  const where =
    kind === "organization"
      ? { organizationId: id }
      : { platformLeadId: id };

  const rows = await prisma.platformActivity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const userIds = rows
    .map((r) => r.platformUserId)
    .filter((x): x is string => Boolean(x));
  const users =
    userIds.length > 0
      ? await prisma.platformUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
  const byId = new Map(users.map((u) => [u.id, u.name]));

  return rows.map((r) => ({
    id: r.id,
    activityType: r.activityType,
    body: r.body,
    createdAt: r.createdAt,
    authorName: r.platformUserId ? (byId.get(r.platformUserId) ?? null) : null,
  }));
}

export async function addActivityForRecord(
  id: string,
  kind: CrmRecordKind,
  input: {
    activityType: "note" | "call" | "meeting";
    body: string;
    platformUserId?: string;
  },
): Promise<void> {
  await prisma.platformActivity.create({
    data: {
      activityType: input.activityType,
      body: input.body,
      platformUserId: input.platformUserId ?? null,
      ...(kind === "organization"
        ? { organizationId: id }
        : { platformLeadId: id }),
    },
  });
}

export async function countCommsThreadsForRecord(
  id: string,
  kind: CrmRecordKind,
): Promise<number> {
  return prisma.platformCommsThread.count({
    where:
      kind === "organization"
        ? { organizationId: id }
        : { platformLeadId: id },
  });
}
