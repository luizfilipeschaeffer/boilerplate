const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /authorization/i,
  /bearer/i,
];

export function scrubSecrets(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 8 && /^[A-Za-z0-9+/=_-]{16,}$/.test(value)) return "[REDACTED]";
    return value;
  }
  if (Array.isArray(value)) return value.map(scrubSecrets);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_PATTERNS.some((p) => p.test(k))) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = scrubSecrets(v);
      }
    }
    return out;
  }
  return value;
}

export type StructuredLogFields = {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  moduleId?: string;
  correlationId?: string;
  [key: string]: unknown;
};

export function structuredLog(fields: StructuredLogFields): void {
  const { level, message, ...rest } = fields;
  const payload = scrubSecrets({
    ts: new Date().toISOString(),
    level,
    message,
    ...rest,
  });
  console.log(JSON.stringify(payload));
}
