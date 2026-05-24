export class ActionOriginError extends Error {
  constructor(message = "Origin inválida") {
    super(message);
    this.name = "ActionOriginError";
  }
}

function parseHost(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return url.host;
  } catch {
    const host = trimmed.replace(/^https?:\/\//, "").split("/")[0];
    return host || null;
  }
}

export function collectAllowedActionHosts(extra?: string[]): Set<string> {
  const hosts = new Set<string>();
  for (const raw of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL,
    process.env.AUTH_URL,
    ...(extra ?? []),
  ]) {
    if (!raw?.trim()) continue;
    for (const segment of raw.split(",")) {
      const host = parseHost(segment);
      if (host) hosts.add(host);
    }
  }
  return hosts;
}

export function assertSameOriginFromHeaders(
  headers: Headers,
  allowedHosts: Set<string>,
): void {
  const origin = headers.get("origin");
  if (!origin) return;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ActionOriginError();
  }

  if (!allowedHosts.has(originHost)) {
    throw new ActionOriginError();
  }
}
