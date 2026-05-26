import {
  classificarFase,
  type DiagnosticoInput,
} from "@boilerplate/module-registry";
import {
  computeProvisioningStatus,
  expandModuleIds,
  resolveActivationPackage,
  trialEndFromNow,
} from "./activation";
import { prisma } from "./client";
import { getDefaultPaymentIntegratorId } from "./platform-payment";
import {
  createOrganizationWithTenant,
  getMembershipForUser,
  registerModuloDemanda,
  resolveUniqueOrganizationSlug,
  setOrganizationModules,
  syncSectorModulesFromTemplate,
} from "./organization";
import { recordProvisioningPlatformActivity } from "./provisioning-events";

export type { DiagnosticoInput };

export interface CompleteOnboardingOptions {
  /** Fase escolhida pelo cliente (override); se omitida, usa classificarFase. */
  declaredPhase?: number;
  /** Segmento de mercado (slug). */
  marketSegmentSlug?: string;
}

export async function completeOnboarding(
  userId: string,
  input: DiagnosticoInput & { organizationName: string },
  opts?: CompleteOnboardingOptions,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Usuário não encontrado. Saia e entre novamente.");
  }

  const existing = await getMembershipForUser(userId);
  if (existing) {
    throw new Error("Usuário já concluiu o onboarding");
  }

  const diagnosedPhase = classificarFase(input);
  const declaredPhase =
    opts?.declaredPhase ?? input.declaredPhase ?? diagnosedPhase;
  const phase = declaredPhase as 1 | 2 | 3 | 4;
  const marketSegmentSlug =
    opts?.marketSegmentSlug ??
    input.segmentoAtuacao ??
    "varejo";

  const pkg = await resolveActivationPackage({
    marketSegmentSlug,
    phase,
    tipoNegocio: input.tipoNegocio,
    possuiCnpj: input.possuiCnpj,
    diagnostico: input,
  });

  const paymentVerified = !pkg.requiresPaymentValidation;
  const provisioningStatus = computeProvisioningStatus(pkg, paymentVerified);
  const integratorId = await getDefaultPaymentIntegratorId();
  const trialEndsAt = paymentVerified
    ? trialEndFromNow(pkg.trialDays)
    : null;

  const slug = await resolveUniqueOrganizationSlug(input.organizationName);

  const org = await createOrganizationWithTenant(
    {
      name: input.organizationName,
      slug,
      tipoNegocio: input.tipoNegocio,
      phase,
      segmentoAtuacao: marketSegmentSlug,
      marketSegmentSlug,
      diagnosedPhase,
      declaredPhase,
      provisioningStatus,
      paymentIntegratorId: integratorId,
      trialEndsAt,
      hasCnpj: input.possuiCnpj,
      cnpj: input.cnpj,
      fiscalReady: input.possuiCnpj && (input.emiteNota ?? false),
    },
    userId,
  );

  let moduleIds = await expandModuleIds(pkg.moduleIds);
  if (
    provisioningStatus === "pre_active" ||
    provisioningStatus === "pending_payment"
  ) {
    const coreOnly = [
      "core-catalogo",
      "core-clientes",
      "core-vendas",
      "aprendiz",
    ];
    moduleIds = moduleIds.filter((id) => coreOnly.includes(id));
    if (moduleIds.length === 0) moduleIds = coreOnly;
  }

  await setOrganizationModules(org.id, moduleIds);
  await syncSectorModulesFromTemplate(org.id, {
    marketSegmentSlug,
    phase,
    moduleIds,
  });
  await registerModuloDemanda(org.id, pkg.demandaModuleIds);

  await recordProvisioningPlatformActivity({
    organizationId: org.id,
    activityType: pkg.fallbackUsed
      ? "tenant.modules_activated"
      : "tenant.pre_activated",
    body: pkg.fallbackUsed
      ? `Ativação com pacote legado (segmento ${marketSegmentSlug}, fase P${phase})`
      : `Pré-ativação segmento ${marketSegmentSlug} fase P${phase}${pkg.requiresPaymentValidation ? " — aguardando pagamento" : ""}`,
  });

  if (paymentVerified) {
    await recordProvisioningPlatformActivity({
      organizationId: org.id,
      activityType: "tenant.trial_started",
      body: `Trial de ${pkg.trialDays} dias iniciado`,
    });
  }

  return {
    organizationId: org.id,
    schemaName: org.schemaName,
    sectorId: "geral",
    fase: phase,
    diagnosedPhase,
    declaredPhase,
    marketSegmentSlug,
    provisioningStatus,
    requiresPaymentValidation: pkg.requiresPaymentValidation,
    modulosAtivos: moduleIds,
    fallbackUsed: pkg.fallbackUsed,
    bundlePrecoId: pkg.bundlePrecoId,
  };
}
