import { prisma } from "./client";

export type PlatformAuditEntityType =
  | "segment"
  | "segment_phase"
  | "bundle"
  | "gateway";

export async function writePlatformConfigAudit(input: {
  entityType: PlatformAuditEntityType;
  entityId: string;
  action: string;
  actorPlatformUserId?: string | null;
  diff?: Record<string, unknown>;
}): Promise<void> {
  await prisma.platformConfigAuditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorPlatformUserId: input.actorPlatformUserId ?? null,
      diff: (input.diff ?? {}) as object,
    },
  });
}

export async function listPlatformConfigAudit(opts?: {
  entityType?: string;
  limit?: number;
}): Promise<
  {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    actorPlatformUserId: string | null;
    diff: unknown;
    createdAt: Date;
  }[]
> {
  return prisma.platformConfigAuditLog.findMany({
    where: opts?.entityType ? { entityType: opts.entityType } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
  });
}
