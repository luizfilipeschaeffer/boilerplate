import { scrubSecrets } from "../logging/structured";

export type AuditLogEntry = {
  action: string;
  actorId: string;
  organizationId?: string;
  branchId?: string;
  moduleId?: string;
  resourceType?: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
};

export type AuditPersistFn = (entry: AuditLogEntry & { diff?: unknown }) => Promise<void>;

let persistFn: AuditPersistFn | null = null;

export function configureAuditTrail(fn: AuditPersistFn): void {
  persistFn = fn;
}

export async function auditTrail(entry: AuditLogEntry): Promise<void> {
  const diff =
    entry.before !== undefined || entry.after !== undefined
      ? scrubSecrets({ before: entry.before, after: entry.after })
      : undefined;

  const payload = scrubSecrets({ ...entry, diff });

  if (persistFn) {
    await persistFn({ ...entry, diff });
    return;
  }

  console.log(
    JSON.stringify({
      type: "audit",
      ...(payload as Record<string, unknown>),
      ts: new Date().toISOString(),
    }),
  );
}
