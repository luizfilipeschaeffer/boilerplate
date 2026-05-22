"use server";

import { auth } from "@/auth";
import {
  getMembershipForUser,
  handlePaymentWebhook,
  listPlatformPaymentGateways,
  setTenantPaymentIntegrator,
  startPaymentValidation,
} from "@boilerplate/db";

export async function loadBillingPageData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) throw new Error("Sem organização");

  const gateways = await listPlatformPaymentGateways({ ativoOnly: true });
  const org = membership.organization;

  return {
    organizationId: org.id,
    provisioningStatus: org.provisioningStatus,
    requiresPayment:
      org.provisioningStatus === "pending_payment" ||
      org.provisioningStatus === "pre_active",
    paymentVerified: Boolean(org.paymentMethodVerifiedAt),
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    gateways: gateways.map((g) => ({
      id: g.integratorId,
      label: g.label,
      isDefault: g.isDefault,
    })),
    currentIntegratorId: org.paymentIntegratorId,
  };
}

export async function iniciarValidacaoPagamento(integratorId?: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Não autenticado");
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) throw new Error("Sem organização");

  if (integratorId) {
    await setTenantPaymentIntegrator(membership.organizationId, integratorId);
  }

  return startPaymentValidation(
    membership.organizationId,
    session.user.email,
    session.user.name ?? session.user.email,
  );
}

export async function confirmarPagamentoMockAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) throw new Error("Sem organização");

  return handlePaymentWebhook("payment-mock", {
    event: "payment.confirmed",
    tenantId: membership.organizationId,
    customerRef: membership.organization.paymentCustomerRef,
  });
}
