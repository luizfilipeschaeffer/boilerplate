"use server";

import { auth } from "@/auth";
import {
  addOrganizationModules,
  applyOrganizationPlan,
  getOrganizationCompanySettings,
  updateOrganizationProfile,
  type OrganizationProfileInput,
} from "@boilerplate/db";
import { getAllModules } from "@boilerplate/module-registry";
import { formatCentavosBRL } from "@boilerplate/billing";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { revalidateDashboardShell } from "@/lib/revalidate-dashboard-shell";

ensureModulesRegistered();

async function requireOrgManager() {
  const session = await auth();
  const orgId = session?.organizationId;
  const userId = session?.user?.id;
  const role = session?.role ?? "dono";
  if (!orgId || !userId) throw new Error("Sessão inválida.");
  if (role !== "dono" && role !== "gerente") {
    throw new Error("Sem permissão para alterar dados da empresa.");
  }
  return { orgId, userId, role };
}

export async function getOrganizationSettingsAction() {
  const session = await auth();
  const orgId = session?.organizationId;
  const role = session?.role ?? "dono";
  if (!orgId) throw new Error("Organização não disponível.");

  const settings = await getOrganizationCompanySettings(orgId);
  if (!settings) throw new Error("Empresa não encontrada.");

  const activeSet = new Set(settings.activeModuleIds);
  const planoInclusos = new Set(
    settings.planos.find((p) => p.id === settings.billing.planoId)
      ?.modulosInclusos ?? [],
  );

  const catalog = getAllModules()
    .filter((m) => m.implementationStatus !== "deprecated")
    .map((m) => {
      const preco = settings.modulePrices.find((p) => p.moduleId === m.id);
      return {
        id: m.id,
        name: m.name,
        faseMinima: m.faseMinima,
        implementationStatus: m.implementationStatus,
        active: activeSet.has(m.id),
        includedInPlan: planoInclusos.has(m.id),
        precoMensalCentavos: preco?.precoMensalCentavos ?? 0,
        precoLabel:
          preco && preco.precoMensalCentavos > 0
            ? formatCentavosBRL(preco.precoMensalCentavos)
            : "Incluso",
        cobrancaAvulsa: preco?.cobrancaAvulsa ?? false,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    ...settings,
    canEdit: role === "dono" || role === "gerente",
    moduleCatalog: catalog,
    availableToContract: catalog.filter((m) => !m.active),
  };
}

export async function saveOrganizationProfileAction(
  input: OrganizationProfileInput,
) {
  const { orgId } = await requireOrgManager();
  await updateOrganizationProfile(orgId, input);
  revalidateDashboardShell();
  return { ok: true };
}

export async function selectOrganizationPlanAction(planoId: string) {
  const { orgId } = await requireOrgManager();
  const moduleIds = await applyOrganizationPlan(orgId, planoId);
  revalidateDashboardShell();
  return { moduleIds };
}

export async function contractOrganizationModulesAction(moduleIds: string[]) {
  const { orgId } = await requireOrgManager();
  if (moduleIds.length === 0) throw new Error("Selecione ao menos um módulo.");
  const merged = await addOrganizationModules(orgId, moduleIds);
  revalidateDashboardShell();
  return { moduleIds: merged };
}
