import { prisma } from "./client";
import {
  resolveMemberAccountStatus,
  type MemberAccountStatus,
} from "./member-account-status";
import { listSectors, type SectorRow } from "./sectors-admin";

export type { MemberAccountStatus } from "./member-account-status";
export {
  MEMBER_ACCOUNT_STATUS_LABELS,
  resolveMemberAccountStatus,
} from "./member-account-status";

export interface OrgMemberRow {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  sectorIds: string[];
  active: boolean;
  hasPassword: boolean;
  accountStatus: MemberAccountStatus;
}

export async function listOrganizationIdsForUserEmail(
  email: string,
): Promise<string[]> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { memberships: { select: { organizationId: true } } },
  });
  return user?.memberships.map((m) => m.organizationId) ?? [];
}

export async function listOrganizationMembers(
  organizationId: string,
): Promise<OrgMemberRow[]> {
  const rows = await prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { id: true, name: true, email: true, passwordHash: true },
      },
      membershipSectors: { select: { sectorId: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((m) => {
    const hasPassword = Boolean(m.user.passwordHash);
    const active = m.active;
    return {
      membershipId: m.id,
      userId: m.userId,
      name: m.user.name?.trim() || m.user.email,
      email: m.user.email,
      role: m.role,
      sectorIds: m.membershipSectors.map((ms) => ms.sectorId),
      active,
      hasPassword,
      accountStatus: resolveMemberAccountStatus({ membershipActive: active, hasPassword }),
    };
  });
}

export async function listSectorMembershipIds(
  sectorId: string,
): Promise<string[]> {
  const rows = await prisma.membershipSector.findMany({
    where: { sectorId },
    select: { membershipId: true },
  });
  return rows.map((r) => r.membershipId);
}

/** Substitui todos os membros vinculados a um setor. */
export async function setSectorMemberships(
  sectorId: string,
  membershipIds: string[],
): Promise<void> {
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    select: { organizationId: true },
  });
  if (!sector) throw new Error("Setor não encontrado");

  const uniqueIds = [...new Set(membershipIds)];

  await prisma.$transaction(async (tx) => {
    await tx.membershipSector.deleteMany({ where: { sectorId } });
    if (uniqueIds.length === 0) return;

    const valid = await tx.membership.findMany({
      where: {
        id: { in: uniqueIds },
        organizationId: sector.organizationId,
      },
      select: { id: true },
    });

    if (valid.length > 0) {
      await tx.membershipSector.createMany({
        data: valid.map((m) => ({ membershipId: m.id, sectorId })),
        skipDuplicates: true,
      });
    }
  });
}

/**
 * Setores que o usuário pode escolher na sidebar.
 * Dono/gerente: todos os setores da organização.
 * Demais papéis: setores vinculados em membership_sectors; sem vínculo, só "geral".
 */
export async function listSectorsAccessibleToUser(
  userId: string,
  organizationId: string,
): Promise<SectorRow[]> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    include: {
      membershipSectors: {
        include: { sector: true },
      },
    },
  });

  if (!membership) return [];

  const all = await listSectors(organizationId);
  const isAdmin =
    membership.role === "dono" || membership.role === "gerente";

  // Dono/gerente enxergam todos os setores da org (sidebar e permissões de contexto).
  if (isAdmin) return all;

  if (membership.membershipSectors.length === 0) {
    const geral = all.filter((s) => s.slug === "geral");
    return geral.length > 0 ? geral : all.slice(0, 1);
  }

  return membership.membershipSectors
    .map((ms) => ({
      id: ms.sector.id,
      organization_id: ms.sector.organizationId,
      name: ms.sector.name,
      slug: ms.sector.slug,
      core_sector_slug: ms.sector.coreSectorSlug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function userCanAccessSector(
  userId: string,
  organizationId: string,
  sectorSlug: string,
): Promise<boolean> {
  const allowed = await listSectorsAccessibleToUser(userId, organizationId);
  return allowed.some((s) => s.slug === sectorSlug);
}
