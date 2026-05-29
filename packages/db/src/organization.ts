import type { Fase } from "@boilerplate/shared";
import { prisma, type Prisma } from "./client";
import { resolveDeploymentMode } from "@boilerplate/platform-api";
import { loadLicenseCache } from "./self-hosted/local-install-state";
import type { LicensePayload } from "@boilerplate/platform-api";
import { ensureDefaultBranch } from "./branches";
import {
  distributeModulesToSectors,
  provisionSectorsForPhase,
} from "./sector-provisioning";
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
  marketSegmentSlug?: string | null;
  diagnosedPhase?: number | null;
  declaredPhase?: number | null;
  provisioningStatus?: string;
  paymentIntegratorId?: string | null;
  trialEndsAt?: Date | null;
  hasCnpj: boolean;
  cnpj?: string | null;
  fiscalReady: boolean;
}

export async function createOrganizationWithTenant(
  input: CreateOrganizationInput,
  ownerUserId: string,
) {
  if (resolveDeploymentMode() === "self_hosted") {
    const cached = await loadLicenseCache();
    if (cached) {
      const license = JSON.parse(cached.payloadJson) as LicensePayload;
      const count = await prisma.organization.count();
      if (count >= license.limits.organizations) {
        throw new Error(
          `Limite de organizações atingido (${license.limits.organizations}).`,
        );
      }
    }
  }

  const schemaName = schemaNameFromSlug(input.slug);
  const marketSegmentSlug =
    input.marketSegmentSlug ?? input.segmentoAtuacao ?? "varejo";
  const declaredPhase = (input.declaredPhase ?? input.phase) as Fase;

  const { org, membershipId, branchId } = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const organizationData: Prisma.OrganizationUncheckedCreateInput = {
        name: input.name,
        slug: input.slug,
        schemaName,
        phase: input.phase,
        tipoNegocio: input.tipoNegocio,
        segmentoAtuacao: input.segmentoAtuacao,
        marketSegmentSlug,
        diagnosedPhase: input.diagnosedPhase ?? input.phase,
        declaredPhase,
        provisioningStatus: input.provisioningStatus ?? "trial",
        paymentIntegratorId: input.paymentIntegratorId ?? null,
        trialEndsAt: input.trialEndsAt ?? null,
        hasCnpj: input.hasCnpj,
        cnpj: input.cnpj,
        fiscalReady: input.fiscalReady,
      };

      const organization = await tx.organization.create({
        data: organizationData,
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
        } satisfies Prisma.MembershipUncheckedCreateInput,
      });

      await provisionSectorsForPhase(
        {
          organizationId: organization.id,
          marketSegmentSlug,
          phase: declaredPhase,
          branchId: branch.id,
          ownerMembershipId: membership.id,
        },
        tx,
      );

      return {
        org: organization,
        membershipId: membership.id,
        branchId: branch.id,
      };
    },
  );

  await provisionTenantSchema(org.schemaName);
  await ensureDefaultBranch(org.id);

  return org;
}

/** Após definir modulos_ativos, distribui nos setores do template. */
export async function syncSectorModulesFromTemplate(
  organizationId: string,
  opts: { marketSegmentSlug: string; phase: Fase; moduleIds: string[] },
): Promise<void> {
  await distributeModulesToSectors({
    organizationId,
    marketSegmentSlug: opts.marketSegmentSlug,
    phase: opts.phase,
    activeModuleIds: opts.moduleIds,
  });
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
