import type { OrgBootContext, ModuleCapabilities } from "@boilerplate/sdk-core";
import { assertCapability } from "@boilerplate/sdk-core";
import { createRepositoryProxy, type FixedTenantScope } from "@boilerplate/sandbox";

export type QueryFn = (
  table: string,
  operation: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

export function createRepository<T extends Record<string, unknown>>(
  moduleId: string,
  table: string,
  caps: ModuleCapabilities,
  scope: FixedTenantScope,
  queryFn: QueryFn,
) {
  assertCapability(caps, "database", moduleId);
  return createRepositoryProxy<T>(scope, table, queryFn);
}

export type ModuleBootOptions = {
  moduleId: string;
  capabilities: ModuleCapabilities;
  orgContext: OrgBootContext;
  queryFn?: QueryFn;
  config?: Record<string, string>;
};

export type ModuleServerContext = {
  moduleId: string;
  org: OrgBootContext;
  createRepo: <T extends Record<string, unknown>>(table: string) => ReturnType<typeof createRepository<T>>;
  config: Record<string, string>;
};

export function createModuleContext(opts: ModuleBootOptions): ModuleServerContext {
  const scope: FixedTenantScope = {
    organizationId: opts.orgContext.organizationId,
    schemaName: opts.orgContext.schemaName,
    branchId: opts.orgContext.branchId,
    departmentId: opts.orgContext.departmentId,
  };

  const queryFn =
    opts.queryFn ??
    (() => {
      throw new Error("queryFn not configured — wire @boilerplate/db in app bootstrap");
    });

  return {
    moduleId: opts.moduleId,
    org: opts.orgContext,
    config: opts.config ?? {},
    createRepo: <T extends Record<string, unknown>>(table: string) =>
      createRepository<T>(opts.moduleId, table, opts.capabilities, scope, queryFn),
  };
}
