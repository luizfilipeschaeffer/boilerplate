import type { DomainEventType } from "@boilerplate/shared";
import { prisma } from "./client";

export type { DomainEventType };

export async function persistDomainEvent(input: {
  organizationId: string;
  eventType: DomainEventType;
  payload: Record<string, unknown>;
}): Promise<void> {
  await prisma.domainEvent.create({
    data: {
      organizationId: input.organizationId,
      eventType: input.eventType,
      payload: input.payload as object,
    },
  });
}

export async function listCrmDomainEventsForRecord(
  organizationId: string,
  targetId: string,
  limit = 30,
): Promise<
  {
    id: string;
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: Date;
  }[]
> {
  const rows = await prisma.domainEvent.findMany({
    where: {
      organizationId,
      eventType: { startsWith: "crm." },
    },
    orderBy: { createdAt: "desc" },
    take: limit * 3,
  });

  return rows
    .filter((row) => {
      const p = row.payload as Record<string, unknown>;
      const kind = p.targetKind as string | undefined;
      return (
        p.targetId === targetId ||
        p.leadId === targetId ||
        p.dealId === targetId ||
        (kind != null && p.targetId === targetId)
      );
    })
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      eventType: row.eventType,
      payload: row.payload as Record<string, unknown>,
      createdAt: row.createdAt,
    }));
}
