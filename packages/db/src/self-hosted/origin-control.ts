import { prisma } from "../client";
import {
  ensureLocalInstallTables,
  loadInstallationConfigRow,
} from "./local-install-state";

export type OriginRule = {
  host: string;
  includeSubdomains?: boolean;
};

function normalizeHost(input: string): string {
  const trimmed = input.trim().toLowerCase();
  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).host.toLowerCase();
    }
  } catch {
    /* plain host */
  }
  return trimmed.replace(/\/+$/, "").split("/")[0] ?? trimmed;
}

export function parseOriginRules(raw: string[]): OriginRule[] {
  return raw.map((entry) => {
    const host = normalizeHost(entry);
    return {
      host,
      includeSubdomains: host.startsWith("*."),
    };
  });
}

export function hostMatchesRule(host: string, rule: OriginRule): boolean {
  const h = normalizeHost(host);
  if (rule.includeSubdomains && rule.host.startsWith("*.")) {
    const suffix = rule.host.slice(2);
    return h === suffix || h.endsWith(`.${suffix}`);
  }
  return h === rule.host;
}

export function isHostAllowed(
  host: string | null | undefined,
  allowed: string[],
): boolean {
  if (!host) return false;
  if (allowed.length === 0) return true;
  const rules = parseOriginRules(allowed);
  const normalized = normalizeHost(host);
  if (normalized === "localhost" || normalized.startsWith("127.0.0.1")) {
    return true;
  }
  return rules.some((rule) => hostMatchesRule(normalized, rule));
}

export async function getLocalAllowedOrigins(): Promise<string[]> {
  await ensureLocalInstallTables();
  const row = await loadInstallationConfigRow();
  if (!row?.allowed_origins) {
    const fromEnv = process.env.ALLOWED_HOSTS ?? process.env.ALLOWED_ORIGINS ?? "";
    return fromEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const parsed = row.allowed_origins as unknown;
  if (Array.isArray(parsed)) return parsed.map(String);
  return [];
}

export async function saveLocalAllowedOrigins(origins: string[]): Promise<void> {
  await ensureLocalInstallTables();
  const normalized = [...new Set(origins.map(normalizeHost).filter(Boolean))];
  await prisma.$executeRaw`
    UPDATE boilerplate.installation_config
    SET allowed_origins = ${JSON.stringify(normalized)}::jsonb
    WHERE id = 'default'
  `;
}

export async function getCentralAllowedOrigins(
  installationId: string,
): Promise<string[]> {
  const inst = await prisma.selfHostedInstallation.findUnique({
    where: { id: installationId },
    select: { allowedOrigins: true },
  });
  if (!inst) return [];
  const parsed = inst.allowedOrigins as unknown;
  if (Array.isArray(parsed)) return parsed.map(String);
  return [];
}

export async function setCentralAllowedOrigins(
  installationId: string,
  origins: string[],
): Promise<void> {
  const normalized = [...new Set(origins.map(normalizeHost).filter(Boolean))];
  await prisma.selfHostedInstallation.update({
    where: { id: installationId },
    data: { allowedOrigins: normalized },
  });
}

export { normalizeHost };
