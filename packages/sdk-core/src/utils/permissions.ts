import type { CanFn, MembershipRoleGrant, Permission, PermissionScope } from "../contracts/permissions";
import type { OrgContext } from "../contracts/org-context";

function scopeSpecificity(scope: Partial<PermissionScope>): number {
  let score = 0;
  if (scope.teamId) score += 4;
  if (scope.departmentId) score += 3;
  if (scope.branchId) score += 2;
  if (scope.organizationId) score += 1;
  return score;
}

export function resolveMostSpecificGrant(
  grants: MembershipRoleGrant[],
  target: Partial<PermissionScope>,
): MembershipRoleGrant | null {
  const orgId = target.organizationId;
  if (!orgId) return null;

  const matching = grants.filter((g) => {
    if (g.organizationId !== orgId) return false;
    if (target.branchId && g.branchId && g.branchId !== target.branchId) return false;
    if (target.departmentId && g.departmentId && g.departmentId !== target.departmentId)
      return false;
    if (target.teamId && g.teamId && g.teamId !== target.teamId) return false;
    return true;
  });

  if (matching.length === 0) return null;

  return matching.sort((a, b) => {
    const sa = scopeSpecificity({
      organizationId: a.organizationId,
      branchId: a.branchId,
      departmentId: a.departmentId,
      teamId: a.teamId,
    });
    const sb = scopeSpecificity({
      organizationId: b.organizationId,
      branchId: b.branchId,
      departmentId: b.departmentId,
      teamId: b.teamId,
    });
    return sb - sa;
  })[0]!;
}

export function createCanFn(
  grants: MembershipRoleGrant[],
  basePermissions: Set<Permission>,
): CanFn {
  return (permission, scope) => {
    const grant = scope
      ? resolveMostSpecificGrant(grants, {
          organizationId: scope.organizationId ?? grants[0]?.organizationId ?? "",
          branchId: scope.branchId,
          departmentId: scope.departmentId,
          teamId: scope.teamId,
        })
      : null;

    if (grant?.permissions.includes(permission)) return true;
    return basePermissions.has(permission);
  };
}

export function buildOrgContext(
  base: Omit<OrgContext, "can" | "resolvedPermissions" | "grants"> & {
    grants?: MembershipRoleGrant[];
    basePermissions?: Permission[];
  },
): OrgContext {
  const grants = base.grants ?? [];
  const resolvedPermissions = new Set<Permission>(base.basePermissions ?? []);
  for (const g of grants) {
    for (const p of g.permissions) resolvedPermissions.add(p);
  }

  return {
    ...base,
    grants,
    resolvedPermissions,
    can: createCanFn(grants, resolvedPermissions),
  };
}
