import type { MembershipRoleGrant as SdkGrant, Permission } from "@boilerplate/sdk-core";
import { buildOrgContext } from "@boilerplate/sdk-core";
import { prisma } from "./client";
import type { ActiveMembershipContext } from "./membership-access";

export async function loadMembershipRoleGrants(
  membershipId: string,
): Promise<SdkGrant[]> {
  const grants = await prisma.membershipRoleGrant.findMany({
    where: { membershipId },
  });

  return grants.map((g: (typeof grants)[number]) => ({
    membershipId: g.membershipId,
    role: g.role,
    organizationId: g.organizationId,
    branchId: g.branchId,
    departmentId: g.departmentId,
    teamId: g.teamId,
    permissions: (g.permissions as Permission[]) ?? [],
  }));
}

export async function buildOrgContextFromMembership(
  membership: ActiveMembershipContext,
  opts?: { departmentId?: string; teamId?: string },
) {
  const grants = await loadMembershipRoleGrants(membership.membershipId);
  const basePermissions: Permission[] = [`${membership.role}.read` as Permission];

  return buildOrgContext({
    organizationId: membership.organizationId,
    schemaName: membership.schemaName,
    userId: membership.userId,
    membershipId: membership.membershipId,
    role: membership.role,
    branchId: membership.branchId,
    departmentId: opts?.departmentId ?? null,
    teamId: opts?.teamId ?? null,
    grants,
    basePermissions,
  });
}

export async function ensureDepartmentForSector(sectorId: string): Promise<string> {
  const existing = await prisma.department.findUnique({ where: { sectorId } });
  if (existing) return existing.id;

  const sector = await prisma.sector.findUniqueOrThrow({ where: { id: sectorId } });
  const dept = await prisma.department.create({
    data: {
      organizationId: sector.organizationId,
      branchId: sector.branchId,
      sectorId: sector.id,
      name: sector.name,
      slug: sector.slug,
    },
  });
  return dept.id;
}
