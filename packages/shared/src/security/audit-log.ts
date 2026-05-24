export type AuditAction =
  | "credential.upsert"
  | "credential.clear"
  | "member.invite"
  | "auth.login"
  | "auth.login_code"
  | "billing.charge"
  | "session.revoke_all";

export type AuditEvent = {
  action: AuditAction;
  actorId: string;
  organizationId?: string;
  metadata?: Record<string, string | number | boolean>;
};

const SENSITIVE_PATTERN =
  /(?:password|secret|token|api[_-]?key|authorization|bearer|otp|code)/i;

function scrubMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!metadata) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_PATTERN.test(key)) continue;
    if (typeof value === "string" && SENSITIVE_PATTERN.test(value)) continue;
    out[key] = value;
  }
  return out;
}

export function auditLog(event: AuditEvent): void {
  console.log(
    JSON.stringify({
      type: "audit",
      ts: new Date().toISOString(),
      action: event.action,
      actorId: event.actorId,
      organizationId: event.organizationId,
      metadata: scrubMetadata(event.metadata),
    }),
  );
}
