export type TenantScopeContext = {
  organizationId: string;
  schemaName: string;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
};

export function injectTenantScope(
  where: Record<string, unknown> | undefined,
  ctx: TenantScopeContext,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    ...(where ?? {}),
    organizationId: ctx.organizationId,
  };

  if (ctx.branchId) base.branchId = ctx.branchId;
  if (ctx.departmentId) base.departmentId = ctx.departmentId;
  if (ctx.teamId) base.teamId = ctx.teamId;

  return base;
}

export function createScopedQueryMiddleware(ctx: TenantScopeContext) {
  return {
    findMany(args: { where?: Record<string, unknown> } | undefined) {
      return { where: injectTenantScope(args?.where, ctx) };
    },
    findFirst(args: { where?: Record<string, unknown> } | undefined) {
      return { where: injectTenantScope(args?.where, ctx) };
    },
    create(data: Record<string, unknown>) {
      return {
        data: {
          ...data,
          organizationId: ctx.organizationId,
          ...(ctx.branchId ? { branchId: ctx.branchId } : {}),
          ...(ctx.departmentId ? { departmentId: ctx.departmentId } : {}),
        },
      };
    },
  };
}

export type ScopedQueryMiddleware = ReturnType<typeof createScopedQueryMiddleware>;
