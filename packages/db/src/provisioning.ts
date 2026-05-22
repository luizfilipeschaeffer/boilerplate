import { prisma } from "./client";
import {
  expandModuleIds,
  resolveActivationPackage,
  trialEndFromNow,
  type ProvisioningStatus,
} from "./activation";
import { registerModuloDemanda, setOrganizationModules } from "./organization";
import { recordProvisioningPlatformActivity } from "./provisioning-events";

export type OrganizationProvisioningRow = {
  id: string;
  name: string;
  slug: string;
  marketSegmentSlug: string | null;
  phase: number;
  declaredPhase: number | null;
  diagnosedPhase: number | null;
  provisioningStatus: string;
  paymentIntegratorId: string | null;
  paymentMethodVerifiedAt: Date | null;
  trialEndsAt: Date | null;
  crmStage: string;
  tipoNegocio: string;
  modulosCount: number;
};

export async function listOrganizationProvisioning(opts?: {
  status?: ProvisioningStatus;
  limit?: number;
}): Promise<OrganizationProvisioningRow[]> {
  const rows = await prisma.organization.findMany({
    where: opts?.status ? { provisioningStatus: opts.status } : undefined,
    include: { _count: { select: { modulosAtivos: true } } },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 100,
  });
  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    marketSegmentSlug: o.marketSegmentSlug,
    phase: o.phase,
    declaredPhase: o.declaredPhase,
    diagnosedPhase: o.diagnosedPhase,
    provisioningStatus: o.provisioningStatus,
    paymentIntegratorId: o.paymentIntegratorId,
    paymentMethodVerifiedAt: o.paymentMethodVerifiedAt,
    trialEndsAt: o.trialEndsAt,
    crmStage: o.crmStage,
    tipoNegocio: o.tipoNegocio,
    modulosCount: o._count.modulosAtivos,
  }));
}

export async function completePaymentVerification(
  organizationId: string,
): Promise<{ provisioningStatus: ProvisioningStatus; trialEndsAt: Date }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) throw new Error("Organização não encontrada");

  const phase = (org.declaredPhase ?? org.phase) as 1 | 2 | 3 | 4;
  const segmentSlug =
    org.marketSegmentSlug ?? org.segmentoAtuacao ?? "varejo";

  const pkg = await resolveActivationPackage({
    marketSegmentSlug: segmentSlug,
    phase,
    tipoNegocio: org.tipoNegocio as never,
    possuiCnpj: org.hasCnpj,
  });

  const moduleIds = await expandModuleIds(pkg.moduleIds);
  await setOrganizationModules(organizationId, moduleIds);
  await registerModuloDemanda(organizationId, pkg.demandaModuleIds);

  const trialEndsAt = trialEndFromNow(pkg.trialDays);
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      paymentMethodVerifiedAt: new Date(),
      provisioningStatus: "trial",
      trialEndsAt,
      crmStage: "trial",
    },
  });

  await recordProvisioningPlatformActivity({
    organizationId,
    activityType: "tenant.payment_verified",
    body: `Pagamento verificado — trial até ${trialEndsAt.toISOString().slice(0, 10)}`,
  });
  await recordProvisioningPlatformActivity({
    organizationId,
    activityType: "tenant.trial_started",
    body: `Trial iniciado (${pkg.trialDays} dias)`,
  });

  return { provisioningStatus: "trial", trialEndsAt };
}
