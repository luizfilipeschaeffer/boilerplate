import {
  decryptEnvelope,
  encryptEnvelope,
  maskSecrets,
} from "@boilerplate/shared/secrets";
import { prisma } from "./client";
import {
  IntegratorCredentialNotConfiguredError,
  isMockIntegrator,
  type CredentialStatus,
  type ResolvedCredentials,
} from "./integrator-credentials.types";
import { writePlatformConfigAudit } from "./platform-audit";

export {
  IntegratorCredentialNotConfiguredError,
  MESSAGING_RESEND_INTEGRATOR_ID,
  isMockIntegrator,
} from "./integrator-credentials.types";
export type {
  CredentialSource,
  CredentialStatus,
  ResolvedCredentials,
} from "./integrator-credentials.types";
export { maskSecret } from "@boilerplate/shared/secrets";

const CACHE_TTL_MS = 120_000;

type CacheEntry = {
  expiresAt: number;
  value: ResolvedCredentials;
};

const resolveCache = new Map<string, CacheEntry>();

function cacheKey(integratorId: string, organizationId?: string | null): string {
  return `${organizationId ?? "platform"}:${integratorId}`;
}

function invalidateCache(integratorId: string, organizationId?: string | null): void {
  resolveCache.delete(cacheKey(integratorId, organizationId));
  resolveCache.delete(cacheKey(integratorId, null));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function decryptRow(
  credentialsEncrypted: string,
  configPublic: unknown,
): { secrets: Record<string, string>; configPublic: Record<string, unknown> } {
  return {
    secrets: decryptEnvelope(credentialsEncrypted),
    configPublic: asRecord(configPublic),
  };
}

async function loadTenantOverride(
  organizationId: string,
  integratorId: string,
): Promise<ResolvedCredentials | null> {
  const row = await prisma.tenantIntegrator.findFirst({
    where: {
      organizationId,
      integratorId,
      ativo: true,
      credentialsEncrypted: { not: null },
    },
  });
  if (!row?.credentialsEncrypted) return null;
  const decrypted = decryptRow(row.credentialsEncrypted, row.configPublic);
  return { ...decrypted, source: "tenant" };
}

async function loadPlatformDefault(
  integratorId: string,
): Promise<ResolvedCredentials | null> {
  const row = await prisma.platformIntegratorCredential.findUnique({
    where: { integratorId },
  });
  if (!row?.credentialsEncrypted) return null;
  const decrypted = decryptRow(row.credentialsEncrypted, row.configPublic);
  return { ...decrypted, source: "platform" };
}

export async function resolve(
  integratorId: string,
  organizationId?: string | null,
): Promise<ResolvedCredentials> {
  if (isMockIntegrator(integratorId)) {
    return { secrets: {}, configPublic: {}, source: "mock" };
  }

  const key = cacheKey(integratorId, organizationId);
  const cached = resolveCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (organizationId) {
    const tenant = await loadTenantOverride(organizationId, integratorId);
    if (tenant) {
      resolveCache.set(key, {
        value: tenant,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return tenant;
    }
  }

  const platform = await loadPlatformDefault(integratorId);
  if (platform) {
    resolveCache.set(key, {
      value: platform,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return platform;
  }

  throw new IntegratorCredentialNotConfiguredError(integratorId, organizationId);
}

export async function isIntegratorConfigured(
  integratorId: string,
  organizationId?: string | null,
): Promise<boolean> {
  if (isMockIntegrator(integratorId)) return true;
  try {
    await resolve(integratorId, organizationId);
    return true;
  } catch (error) {
    if (error instanceof IntegratorCredentialNotConfiguredError) return false;
    throw error;
  }
}

export async function getCredentialStatus(
  integratorId: string,
  organizationId?: string | null,
): Promise<CredentialStatus> {
  if (isMockIntegrator(integratorId)) {
    return {
      configured: true,
      source: "mock",
      maskedSecrets: {},
      configPublic: {},
    };
  }

  if (organizationId) {
    const tenant = await loadTenantOverride(organizationId, integratorId);
    if (tenant) {
      return {
        configured: true,
        source: "tenant",
        maskedSecrets: maskSecrets(tenant.secrets),
        configPublic: tenant.configPublic,
      };
    }
  }

  const platform = await loadPlatformDefault(integratorId);
  if (platform) {
    return {
      configured: true,
      source: "platform",
      maskedSecrets: maskSecrets(platform.secrets),
      configPublic: platform.configPublic,
    };
  }

  return {
    configured: false,
    source: "none",
    maskedSecrets: {},
    configPublic: {},
  };
}

async function mergeSecretsForUpsert(
  existingEncrypted: string | null | undefined,
  incoming: Record<string, string>,
): Promise<Record<string, string>> {
  const merged = { ...incoming };
  if (existingEncrypted) {
    const existing = decryptEnvelope(existingEncrypted);
    for (const [key, value] of Object.entries(incoming)) {
      if (!value.trim() && existing[key]) {
        merged[key] = existing[key];
      }
    }
    for (const key of Object.keys(existing)) {
      if (!(key in merged)) merged[key] = existing[key];
    }
  }
  for (const [key, value] of Object.entries(merged)) {
    if (!value.trim()) {
      delete merged[key];
    }
  }
  return merged;
}

export async function upsertPlatformCredential(input: {
  integratorId: string;
  secrets: Record<string, string>;
  configPublic?: Record<string, unknown>;
  actorPlatformUserId?: string | null;
}): Promise<void> {
  const existing = await prisma.platformIntegratorCredential.findUnique({
    where: { integratorId: input.integratorId },
  });

  const mergedSecrets = await mergeSecretsForUpsert(
    existing?.credentialsEncrypted,
    input.secrets,
  );

  if (Object.keys(mergedSecrets).length === 0) {
    throw new Error("Informe ao menos um campo secreto.");
  }

  const configPublic = {
    ...asRecord(existing?.configPublic),
    ...(input.configPublic ?? {}),
  };
  const credentialsEncrypted = encryptEnvelope(mergedSecrets);

  await prisma.platformIntegratorCredential.upsert({
    where: { integratorId: input.integratorId },
    create: {
      integratorId: input.integratorId,
      configPublic: configPublic as object,
      credentialsEncrypted,
      configuredAt: new Date(),
      configuredByPlatformUserId: input.actorPlatformUserId ?? null,
    },
    update: {
      configPublic: configPublic as object,
      credentialsEncrypted,
      configuredAt: new Date(),
      configuredByPlatformUserId: input.actorPlatformUserId ?? null,
    },
  });

  invalidateCache(input.integratorId, null);

  await writePlatformConfigAudit({
    entityType: "integrator_credential",
    entityId: `platform:${input.integratorId}`,
    action: "credentials_updated",
    actorPlatformUserId: input.actorPlatformUserId,
    diff: {
      integratorId: input.integratorId,
      scope: "platform",
      fieldsUpdated: Object.keys(input.secrets).filter((k) => input.secrets[k]?.trim()),
    },
  });
}

export async function upsertTenantCredential(input: {
  organizationId: string;
  integratorId: string;
  secrets: Record<string, string>;
  configPublic?: Record<string, unknown>;
}): Promise<void> {
  const existing = await prisma.tenantIntegrator.findUnique({
    where: {
      organizationId_integratorId: {
        organizationId: input.organizationId,
        integratorId: input.integratorId,
      },
    },
  });

  const mergedSecrets = await mergeSecretsForUpsert(
    existing?.credentialsEncrypted,
    input.secrets,
  );

  if (Object.keys(mergedSecrets).length === 0) {
    throw new Error("Informe ao menos um campo secreto.");
  }

  const configPublic = {
    ...asRecord(existing?.configPublic),
    ...(input.configPublic ?? {}),
  };
  const credentialsEncrypted = encryptEnvelope(mergedSecrets);

  await prisma.tenantIntegrator.upsert({
    where: {
      organizationId_integratorId: {
        organizationId: input.organizationId,
        integratorId: input.integratorId,
      },
    },
    create: {
      organizationId: input.organizationId,
      integratorId: input.integratorId,
      configPublic: configPublic as object,
      credentialsEncrypted,
      ativo: true,
    },
    update: {
      configPublic: configPublic as object,
      credentialsEncrypted,
      ativo: true,
    },
  });

  invalidateCache(input.integratorId, input.organizationId);

  await writePlatformConfigAudit({
    entityType: "integrator_credential",
    entityId: `tenant:${input.organizationId}:${input.integratorId}`,
    action: "credentials_updated",
    diff: {
      integratorId: input.integratorId,
      scope: "tenant",
      organizationId: input.organizationId,
      fieldsUpdated: Object.keys(input.secrets).filter((k) => input.secrets[k]?.trim()),
    },
  });
}

export async function clearTenantCredentialOverride(
  organizationId: string,
  integratorId: string,
): Promise<void> {
  const existing = await prisma.tenantIntegrator.findUnique({
    where: {
      organizationId_integratorId: { organizationId, integratorId },
    },
  });

  if (!existing?.credentialsEncrypted) return;

  await prisma.tenantIntegrator.update({
    where: {
      organizationId_integratorId: { organizationId, integratorId },
    },
    data: {
      credentialsEncrypted: null,
    },
  });

  invalidateCache(integratorId, organizationId);

  await writePlatformConfigAudit({
    entityType: "integrator_credential",
    entityId: `tenant:${organizationId}:${integratorId}`,
    action: "credentials_cleared",
    diff: {
      integratorId,
      scope: "tenant",
      organizationId,
    },
  });
}

/** Limpa cache (útil em testes). */
export function clearIntegratorCredentialCache(): void {
  resolveCache.clear();
}
