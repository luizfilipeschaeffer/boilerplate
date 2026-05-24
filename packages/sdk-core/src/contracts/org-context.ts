import type { CanFn, MembershipRoleGrant, Permission, PermissionScope } from "./permissions";

export type HierarchyScope = PermissionScope;

export type OrgContext = PermissionScope & {
  schemaName: string;
  userId: string;
  membershipId: string;
  role: string;
  resolvedPermissions: Set<Permission>;
  grants: MembershipRoleGrant[];
  can: CanFn;
};

export type OrgBootContext = Omit<OrgContext, "can" | "resolvedPermissions" | "grants">;
