import type { ModuleCapabilities, ModuleManifest, TrustLevel } from "@boilerplate/sdk-core";
import { assertCapability, CapabilityViolationError } from "@boilerplate/sdk-core";

export type ModuleRuntimeQuotas = {
  maxCpuMs: number;
  maxMemoryMb: number;
  maxRequestsPerMinute: number;
  maxJobsPerDay: number;
  maxAiTokensPerDay: number;
};

export const QUOTAS_BY_TRUST: Record<TrustLevel, ModuleRuntimeQuotas> = {
  community: {
    maxCpuMs: 500,
    maxMemoryMb: 128,
    maxRequestsPerMinute: 60,
    maxJobsPerDay: 1000,
    maxAiTokensPerDay: 5000,
  },
  verified: {
    maxCpuMs: 2000,
    maxMemoryMb: 256,
    maxRequestsPerMinute: 300,
    maxJobsPerDay: 10000,
    maxAiTokensPerDay: 50000,
  },
  certified: {
    maxCpuMs: 5000,
    maxMemoryMb: 512,
    maxRequestsPerMinute: 600,
    maxJobsPerDay: 50000,
    maxAiTokensPerDay: 200000,
  },
  official: {
    maxCpuMs: 30000,
    maxMemoryMb: 1024,
    maxRequestsPerMinute: 3000,
    maxJobsPerDay: 500000,
    maxAiTokensPerDay: 1000000,
  },
};

export function getQuotasForTrust(trust: TrustLevel): ModuleRuntimeQuotas {
  return QUOTAS_BY_TRUST[trust];
}

export function requiresWorkerIsolation(trust: TrustLevel): boolean {
  return trust === "community" || trust === "verified";
}

export type FixedTenantScope = {
  organizationId: string;
  schemaName: string;
  branchId?: string | null;
  departmentId?: string | null;
};

export type RepositoryProxy<T extends Record<string, unknown>> = {
  findMany(args?: Record<string, unknown>): Promise<T[]>;
  findFirst(args?: Record<string, unknown>): Promise<T | null>;
  create(args: { data: Record<string, unknown> }): Promise<T>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<T>;
  delete(args: { where: Record<string, unknown> }): Promise<T>;
};

function injectScope(
  args: Record<string, unknown> | undefined,
  scope: FixedTenantScope,
): Record<string, unknown> {
  const where = (args?.where as Record<string, unknown> | undefined) ?? {};
  return {
    ...args,
    where: {
      ...where,
      organizationId: scope.organizationId,
    },
  };
}

export function createRepositoryProxy<T extends Record<string, unknown>>(
  scope: FixedTenantScope,
  tableName: string,
  queryFn: (table: string, operation: string, args: Record<string, unknown>) => Promise<unknown>,
): RepositoryProxy<T> {
  return {
    findMany: (args) =>
      queryFn(tableName, "findMany", injectScope(args, scope)) as Promise<T[]>,
    findFirst: (args) =>
      queryFn(tableName, "findFirst", injectScope(args, scope)) as Promise<T | null>,
    create: (args) =>
      queryFn(tableName, "create", {
        ...args,
        data: { ...args.data, organizationId: scope.organizationId },
      }) as Promise<T>,
    update: (args) =>
      queryFn(tableName, "update", {
        ...args,
        where: { ...args.where, organizationId: scope.organizationId },
      }) as Promise<T>,
    delete: (args) =>
      queryFn(tableName, "delete", {
        ...args,
        where: { ...args.where, organizationId: scope.organizationId },
      }) as Promise<T>,
  };
}

export type ModuleRuntimeServices = {
  repositories: Record<string, RepositoryProxy<Record<string, unknown>>> | null;
  config: Record<string, string>;
  quotas: ModuleRuntimeQuotas;
};

const stub = () => {
  throw new CapabilityViolationError("database" as keyof ModuleCapabilities, "unknown");
};

export function createModuleRuntime(
  manifest: ModuleManifest,
  scope: FixedTenantScope,
  services?: {
    queryFn?: (table: string, op: string, args: Record<string, unknown>) => Promise<unknown>;
    config?: Record<string, string>;
  },
): ModuleRuntimeServices {
  const caps = manifest.capabilities;
  const quotas = getQuotasForTrust(manifest.trustLevel);

  const repositories =
    caps.database && services?.queryFn
      ? {
          default: createRepositoryProxy(scope, "default", services.queryFn),
        }
      : null;

  return {
    repositories,
    config: services?.config ?? {},
    quotas,
  };
}

export function guardCapability(
  caps: ModuleCapabilities,
  capability: keyof ModuleCapabilities,
  moduleId: string,
): void {
  assertCapability(caps, capability, moduleId);
}

export { CapabilityViolationError };
