import { prisma } from "./client";
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
    where: { userId },
    include: {
      organization: {
        include: {
          modulosAtivos: true,
        },
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

    await tx.sector.create({
      data: {
        organizationId: organization.id,
        name: "Geral",
        slug: "geral",
      },
    });

    await tx.membership.create({
      data: {
        userId: ownerUserId,
        organizationId: organization.id,
        role: "dono",
      },
    });

    return organization;
  });

  await provisionTenantSchema(org.schemaName);
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
