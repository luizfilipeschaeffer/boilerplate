"use server";

import {
  confirmPhaseExpansion,
  expandModuleIds,
  getActiveModuleIdsForOrg,
  getOrganizationById,
  getPendingExpansionPhase,
  preparePhaseExpansion,
  resolveActivationPackage,
} from "@boilerplate/db";
import type { Fase, TipoNegocio } from "@boilerplate/shared";
import { requireTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

function requireOwner(role: string) {
  if (role !== "dono") throw new Error("Apenas o dono pode gerenciar a expansão.");
}

export async function getPhaseExpansionStatusAction() {
  const { organizationId, role } = await requireTenantContext();
  requireOwner(role);
  const pending = await getPendingExpansionPhase(organizationId);
  const org = await getOrganizationById(organizationId);
  return {
    pendingPhase: pending,
    currentPhase: org?.phase ?? 1,
    marketSegmentSlug: org?.marketSegmentSlug ?? org?.segmentoAtuacao ?? "varejo",
  };
}

export async function preparePhaseExpansionAction(targetPhase: number) {
  const { organizationId, role } = await requireTenantContext();
  requireOwner(role);
  const org = await getOrganizationById(organizationId);
  if (!org) throw new Error("Organização não encontrada");

  const phase = targetPhase as Fase;
  if (phase < 1 || phase > 4) throw new Error("Fase inválida");
  if (phase <= org.phase) throw new Error("A fase deve ser maior que a atual");

  const marketSegmentSlug =
    org.marketSegmentSlug ?? org.segmentoAtuacao ?? "varejo";

  const result = await preparePhaseExpansion({
    organizationId,
    targetPhase: phase,
    marketSegmentSlug,
  });

  revalidatePath("/");
  revalidatePath("/configuracoes/setores");

  return {
    targetPhase: phase,
    sectors: [...result.created, ...result.updated],
  };
}

export async function confirmPhaseExpansionAction(targetPhase: number) {
  const { organizationId, role } = await requireTenantContext();
  requireOwner(role);
  const org = await getOrganizationById(organizationId);
  if (!org) throw new Error("Organização não encontrada");

  const phase = targetPhase as Fase;
  const marketSegmentSlug =
    org.marketSegmentSlug ?? org.segmentoAtuacao ?? "varejo";

  const pkg = await resolveActivationPackage({
    marketSegmentSlug,
    phase,
    tipoNegocio: org.tipoNegocio as TipoNegocio,
    possuiCnpj: org.hasCnpj,
  });

  const moduleIds = await expandModuleIds(pkg.moduleIds);
  const existing = await getActiveModuleIdsForOrg(organizationId);
  const merged = [...new Set([...existing, ...moduleIds])];

  await confirmPhaseExpansion({
    organizationId,
    targetPhase: phase,
    marketSegmentSlug,
    activeModuleIds: merged,
  });

  revalidatePath("/");
  revalidatePath("/configuracoes/setores");
  revalidatePath("/dashboard");

  return { phase, moduleCount: merged.length };
}

export async function dismissPhaseExpansionAction() {
  const { organizationId, role } = await requireTenantContext();
  requireOwner(role);
  const { prisma } = await import("@boilerplate/db");
  await prisma.organization.update({
    where: { id: organizationId },
    data: { pendingExpansionPhase: null },
  });
  revalidatePath("/");
}
