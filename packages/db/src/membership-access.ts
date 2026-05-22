import { randomUUID } from "node:crypto";
import { prisma } from "./client";
import { getActiveModuleIdsForOrg } from "./organization";
import {
  getSectorBySlug,
  listSectorModuleIds,
  listSectors,
} from "./sectors-admin";
import { resolveMemberAccountStatus } from "./member-account-status";
import { listOrganizationMembers, type OrgMemberRow } from "./membership-sectors";

export type MemberRole =
  | "dono"
  | "gerente"
  | "vendedor"
  | "operador"
  | "financeiro";

export interface MemberModuleAccessRow {
  moduleId: string;
  enabled: boolean;
  permissions: string[];
  explicit: boolean;
}

export interface MemberSectorAccessRow {
  sectorId: string;
  sectorName: string;
  sectorSlug: string;
  assigned: boolean;
  modules: MemberModuleAccessRow[];
}

export interface MemberAccessDetail extends OrgMemberRow {
  sectors: MemberSectorAccessRow[];
  hasExplicitModuleGrants: boolean;
}

function parsePermissionsJson(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

async function sectorModuleIdsForOrg(
  organizationId: string,
  sectorId: string,
): Promise<string[]> {
  const ids = await listSectorModuleIds(sectorId);
  if (ids.length > 0) return ids;
  return getActiveModuleIdsForOrg(organizationId);
}

export async function getMemberAccessDetail(
  membershipId: string,
  organizationId: string,
): Promise<MemberAccessDetail | null> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
    include: {
      user: {
        select: { id: true, name: true, email: true, passwordHash: true },
      },
      membershipSectors: { select: { sectorId: true } },
      membershipSectorModules: true,
    },
  });
  if (!membership) return null;

  const allSectors = await listSectors(organizationId);
  const assignedIds = new Set(
    membership.membershipSectors.map((ms) => ms.sectorId),
  );

  const grantsBySector = new Map<string, Map<string, string[]>>();
  for (const g of membership.membershipSectorModules) {
    if (!grantsBySector.has(g.sectorId)) {
      grantsBySector.set(g.sectorId, new Map());
    }
    grantsBySector
      .get(g.sectorId)!
      .set(g.moduleId, parsePermissionsJson(g.permissions));
  }

  const sectors: MemberSectorAccessRow[] = [];
  for (const sector of allSectors) {
    const moduleIds = await sectorModuleIdsForOrg(organizationId, sector.id);
    const sectorGrants = grantsBySector.get(sector.id);
    const hasExplicitGrants = (sectorGrants?.size ?? 0) > 0;
    const modules: MemberModuleAccessRow[] = moduleIds.map((moduleId) => {
      if (!hasExplicitGrants) {
        return {
          moduleId,
          enabled: true,
          permissions: [],
          explicit: false,
        };
      }
      const enabled = sectorGrants!.has(moduleId);
      return {
        moduleId,
        enabled,
        permissions: sectorGrants!.get(moduleId) ?? [],
        explicit: true,
      };
    });

    sectors.push({
      sectorId: sector.id,
      sectorName: sector.name,
      sectorSlug: sector.slug,
      assigned: assignedIds.has(sector.id),
      modules,
    });
  }

  const hasPassword = Boolean(membership.user.passwordHash);
  const active = membership.active;

  return {
    membershipId: membership.id,
    userId: membership.userId,
    name: membership.user.name?.trim() || membership.user.email,
    email: membership.user.email,
    role: membership.role,
    sectorIds: [...assignedIds],
    active,
    hasPassword,
    accountStatus: resolveMemberAccountStatus({
      membershipActive: active,
      hasPassword,
    }),
    sectors,
    hasExplicitModuleGrants: membership.membershipSectorModules.length > 0,
  };
}

export async function resolveModuleIdsForMembershipSector(
  userId: string,
  organizationId: string,
  sectorSlug: string,
): Promise<string[] | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { membershipSectorModules: true },
  });
  if (!membership) return null;

  const sector = await getSectorBySlug(organizationId, sectorSlug);
  if (!sector) return null;

  const sectorModules = await sectorModuleIdsForOrg(organizationId, sector.id);
  const grants = membership.membershipSectorModules.filter(
    (g) => g.sectorId === sector.id,
  );

  if (grants.length === 0) return null;

  return grants.map((g) => g.moduleId);
}

export async function createOrganizationMember(
  organizationId: string,
  input: {
    email: string;
    name?: string;
    role: MemberRole;
    sectorIds?: string[];
  },
): Promise<OrgMemberRow> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("E-mail é obrigatório");

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: input.name?.trim() || email.split("@")[0],
    },
    update: input.name?.trim()
      ? { name: input.name.trim() }
      : {},
  });

  const existing = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: user.id, organizationId },
    },
  });
  if (existing) throw new Error("Este e-mail já é membro da organização");

  if (input.role === "dono") {
    const donoCount = await prisma.membership.count({
      where: { organizationId, role: "dono" },
    });
    if (donoCount > 0) {
      throw new Error("Já existe um dono nesta organização");
    }
  }

  const membership = await prisma.membership.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      organizationId,
      role: input.role,
    },
  });

  const sectorIds = input.sectorIds ?? [];
  if (sectorIds.length > 0) {
    await prisma.membershipSector.createMany({
      data: sectorIds.map((sectorId) => ({
        membershipId: membership.id,
        sectorId,
      })),
      skipDuplicates: true,
    });
  }

  const hasPassword = Boolean(user.passwordHash);
  const active = membership.active;

  return {
    membershipId: membership.id,
    userId: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: membership.role,
    sectorIds,
    active,
    hasPassword,
    accountStatus: resolveMemberAccountStatus({
      membershipActive: active,
      hasPassword,
    }),
  };
}

export async function updateMemberRole(
  membershipId: string,
  organizationId: string,
  role: MemberRole,
): Promise<void> {
  if (role === "dono") {
    const current = await prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!current) throw new Error("Membro não encontrado");
    if (current.role !== "dono") {
      const donoCount = await prisma.membership.count({
        where: { organizationId, role: "dono" },
      });
      if (donoCount > 0) throw new Error("Já existe um dono nesta organização");
    }
  }
  await prisma.membership.update({
    where: { id: membershipId },
    data: { role },
  });
}

export interface SaveMemberAccessInput {
  role: MemberRole;
  active?: boolean;
  sectorIds: string[];
  sectors: {
    sectorId: string;
    modules: {
      moduleId: string;
      enabled: boolean;
      permissions: string[];
    }[];
  }[];
}

export async function saveMemberAccess(
  membershipId: string,
  organizationId: string,
  input: SaveMemberAccessInput,
): Promise<void> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
  });
  if (!membership) throw new Error("Membro não encontrado");
  if (membership.role === "dono" && input.active === false) {
    throw new Error("O dono da organização não pode ser inativado");
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.update({
      where: { id: membershipId },
      data: {
        role: input.role,
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    await tx.membershipSector.deleteMany({ where: { membershipId } });
    const uniqueSectorIds = [...new Set(input.sectorIds)];
    if (uniqueSectorIds.length > 0) {
      await tx.membershipSector.createMany({
        data: uniqueSectorIds.map((sectorId) => ({
          membershipId,
          sectorId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.membershipSectorModule.deleteMany({ where: { membershipId } });

    const rows: {
      membershipId: string;
      sectorId: string;
      moduleId: string;
      permissions: string[];
    }[] = [];

    for (const sector of input.sectors) {
      if (!uniqueSectorIds.includes(sector.sectorId)) continue;
      const sectorModules = await sectorModuleIdsForOrg(
        organizationId,
        sector.sectorId,
      );
      const enabledMods = sector.modules.filter(
        (m) => m.enabled && sectorModules.includes(m.moduleId),
      );
      const allOn = enabledMods.length === sectorModules.length;
      const anyCustomPerm = sector.modules.some((m) => m.permissions.length > 0);
      if (allOn && !anyCustomPerm) continue;

      for (const mod of enabledMods) {
        rows.push({
          membershipId,
          sectorId: sector.sectorId,
          moduleId: mod.moduleId,
          permissions: mod.permissions,
        });
      }
    }

    if (rows.length > 0) {
      await tx.membershipSectorModule.createMany({
        data: rows.map((r) => ({
          membershipId: r.membershipId,
          sectorId: r.sectorId,
          moduleId: r.moduleId,
          permissions: r.permissions,
        })),
      });
    }
  });
}
