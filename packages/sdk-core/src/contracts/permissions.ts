export type PermissionScope = {
  organizationId: string;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
};

export type Permission =
  | `${string}.read`
  | `${string}.write`
  | `${string}.admin`
  | "billing.read"
  | "billing.write"
  | "members.manage";

export type CanFn = (
  permission: Permission,
  scope?: Partial<PermissionScope>,
) => boolean;

export type MembershipRoleGrant = {
  membershipId: string;
  role: string;
  organizationId: string;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  permissions: Permission[];
};
