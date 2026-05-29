import { prisma } from "../client";

/** Garante membership ativa na org da instalação (wizard self-hosted / SSO central). */
export async function ensureOwnerMembershipForSetup(
  userId: string,
  organizationId: string,
): Promise<void> {
  const existing = await prisma.membership.findFirst({
    where: { userId, organizationId, active: true },
  });
  if (existing) return;

  let branch = await prisma.branch.findFirst({
    where: { organizationId, isDefault: true },
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        organizationId,
        name: "Matriz",
        slug: "matriz",
        isDefault: true,
      },
    });
  }

  let sector = await prisma.sector.findFirst({
    where: { organizationId, slug: "geral" },
  });
  if (!sector) {
    sector = await prisma.sector.create({
      data: {
        organizationId,
        name: "Geral",
        slug: "geral",
        coreSectorSlug: "comercial",
      },
    });
  }

  const membership = await prisma.membership.create({
    data: {
      userId,
      organizationId,
      role: "dono",
      defaultBranchId: branch.id,
      active: true,
    },
  });

  await prisma.membershipSector.create({
    data: { membershipId: membership.id, sectorId: sector.id },
  });
}
