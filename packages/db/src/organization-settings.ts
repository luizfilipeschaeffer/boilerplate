import { prisma } from "./client";
import {
  calcularMensalidadeFromDb,
  listModuloPrecos,
  listPlanosBase,
  seedDefaultPricingIfEmpty,
} from "./billing-pricing";
import { getActiveModuleIdsForOrg } from "./organization";
import { listSectors, setSectorModules } from "./sectors-admin";

export type OrganizationProfileInput = {
  name: string;
  tipoNegocio: string;
  segmentoAtuacao?: string | null;
  hasCnpj: boolean;
  cnpj?: string | null;
  fiscalReady: boolean;
};

export async function getOrganizationCompanySettings(organizationId: string) {
  await seedDefaultPricingIfEmpty();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      tipoNegocio: true,
      segmentoAtuacao: true,
      hasCnpj: true,
      cnpj: true,
      phase: true,
      crmStage: true,
      fiscalReady: true,
      createdAt: true,
    },
  });

  if (!org) return null;

  const [activeModuleIds, planos, precos] = await Promise.all([
    getActiveModuleIdsForOrg(organizationId),
    listPlanosBase(),
    listModuloPrecos(),
  ]);

  const billing = await calcularMensalidadeFromDb(activeModuleIds, org.phase);
  const planoAtual = planos.find((p) => p.id === billing.planoId) ?? null;
  return {
    organization: org,
    activeModuleIds,
    billing: {
      ...billing,
      planoNome: planoAtual?.nome ?? null,
    },
    planos: planos.filter((p) => p.ativo),
    modulePrices: precos.filter((p) => p.ativo),
  };
}

/** Alinha módulos de todos os setores com os ativos na org (menu da sidebar). */
export async function syncSectorModulesWithOrganization(
  organizationId: string,
  moduleIds: string[],
): Promise<void> {
  const sectors = await listSectors(organizationId);
  await Promise.all(
    sectors.map((sector) => setSectorModules(sector.id, moduleIds)),
  );
}

export async function updateOrganizationProfile(
  organizationId: string,
  input: OrganizationProfileInput,
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome da empresa.");

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name,
      tipoNegocio: input.tipoNegocio,
      segmentoAtuacao: input.segmentoAtuacao?.trim() || null,
      hasCnpj: input.hasCnpj,
      cnpj: input.hasCnpj ? input.cnpj?.trim() || null : null,
      fiscalReady: input.fiscalReady,
    },
  });
}

export async function applyOrganizationPlan(
  organizationId: string,
  planoId: string,
): Promise<string[]> {
  await seedDefaultPricingIfEmpty();
  const planos = await listPlanosBase();
  const plano = planos.find((p) => p.id === planoId && p.ativo);
  if (!plano) throw new Error("Plano não encontrado.");

  const current = await getActiveModuleIdsForOrg(organizationId);
  const merged = [...new Set([...current, ...plano.modulosInclusos])];

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: { phase: plano.faseMinima },
    });
    await tx.moduloAtivo.deleteMany({ where: { organizationId } });
    if (merged.length > 0) {
      await tx.moduloAtivo.createMany({
        data: merged.map((moduloId) => ({ organizationId, moduloId })),
        skipDuplicates: true,
      });
    }
  });

  await syncSectorModulesWithOrganization(organizationId, merged);
  return merged;
}

export async function addOrganizationModules(
  organizationId: string,
  moduleIds: string[],
): Promise<string[]> {
  if (moduleIds.length === 0) return getActiveModuleIdsForOrg(organizationId);

  const current = await getActiveModuleIdsForOrg(organizationId);
  const merged = [...new Set([...current, ...moduleIds])];

  await prisma.moduloAtivo.createMany({
    data: moduleIds
      .filter((id) => !current.includes(id))
      .map((moduloId) => ({ organizationId, moduloId })),
    skipDuplicates: true,
  });

  await syncSectorModulesWithOrganization(organizationId, merged);
  return merged;
}
