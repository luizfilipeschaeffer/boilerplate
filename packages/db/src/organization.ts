import { prisma } from "./client";
import { ensureDefaultBranch } from "./branches";
import { seedDefaultSectorModules } from "./sectors-admin";
import { provisionTenantSchema } from "./tenant/provision";
import { schemaNameFromSlug } from "./tenant/schema";

export async function findOrCreateUserByEmail(email: string, name?: string) {
  return prisma.user.upsert({
    where: { email },
    create: { email, name: name ?? email.split("@")[0] },
    update: { name: name ?? undefined },
  });
}

export async function getMembershipForUser(userId: string) {
  return prisma.membership.findFirst({
    where: { userId, active: true },
    include: {
      organization: {
        include: {
          modulosAtivos: true,
        },
      },
      defaultBranch: true,
      membershipSectors: {
        include: { sector: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getActiveModuleIdsForOrg(
  organizationId: string,
): Promise<string[]> {
  const rows = await prisma.moduloAtivo.findMany({
    where: { organizationId },
    select: { moduloId: true },
  });
  return rows.map((r) => r.moduloId);
}

export async function organizationHasOnboarding(
  organizationId: string,
): Promise<boolean> {
  const count = await prisma.moduloAtivo.count({
    where: { organizationId },
  });
  return count > 0;
}

export async function getOrganizationById(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: { modulosAtivos: true },
  });
}

export function slugifyOrganizationName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

/** Garante slug único (ex.: "informatica", "informatica-2"). */
export async function resolveUniqueOrganizationSlug(
  organizationName: string,
): Promise<string> {
  const base = slugifyOrganizationName(organizationName);
  let candidate = base;
  let suffix = 0;

  while (
    await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    suffix += 1;
    const tail = `-${suffix}`;
    candidate = `${base.slice(0, Math.max(1, 48 - tail.length))}${tail}`;
  }

  return candidate;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  tipoNegocio: string;
  phase: number;
  segmentoAtuacao?: string | null;
  hasCnpj: boolean;
  cnpj?: string | null;
  fiscalReady: boolean;
}

export async function createOrganizationWithTenant(
  input: CreateOrganizationInput,
  ownerUserId: string,
) {
  const schemaName = schemaNameFromSlug(input.slug);

  const org = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        schemaName,
        phase: input.phase,
        tipoNegocio: input.tipoNegocio,
        segmentoAtuacao: input.segmentoAtuacao,
        hasCnpj: input.hasCnpj,
        cnpj: input.cnpj,
        fiscalReady: input.fiscalReady,
      },
    });

    const sector = await tx.sector.create({
      data: {
        organizationId: organization.id,
        name: "Geral",
        slug: "geral",
        coreSectorSlug: "comercial",
      },
    });

    const branch = await tx.branch.create({
      data: {
        organizationId: organization.id,
        name: "Matriz",
        slug: "matriz",
        isDefault: true,
      },
    });

    const membership = await tx.membership.create({
      data: {
        userId: ownerUserId,
        organizationId: organization.id,
        role: "dono",
        defaultBranchId: branch.id,
      },
    });

    await tx.membershipSector.create({
      data: {
        membershipId: membership.id,
        sectorId: sector.id,
      },
    });

    return organization;
  });

  await provisionTenantSchema(org.schemaName);

  const moduleIds = await getActiveModuleIdsForOrg(org.id);
  await seedDefaultSectorModules(org.id, "geral", moduleIds);
  await ensureDefaultBranch(org.id);

  return org;
}

export async function setOrganizationModules(
  organizationId: string,
  moduleIds: string[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.moduloAtivo.deleteMany({ where: { organizationId } });
    if (moduleIds.length === 0) return;
    await tx.moduloAtivo.createMany({
      data: moduleIds.map((moduloId) => ({
        organizationId,
        moduloId,
      })),
      skipDuplicates: true,
    });
  });
}

export async function registerModuloDemanda(
  organizationId: string,
  moduleIds: string[],
  motivo?: string,
): Promise<void> {
  if (moduleIds.length === 0) return;
  await prisma.moduloDemanda.createMany({
    data: moduleIds.map((moduloId) => ({
      organizationId,
      moduloId,
      motivo: motivo ?? "Sugerido no diagnóstico (planned)",
    })),
    skipDuplicates: true,
  });
}
