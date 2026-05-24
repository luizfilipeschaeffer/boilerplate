import { calcularMensalidade } from "@boilerplate/billing";
import { getPaymentAdapter } from "@boilerplate/integrators";
import { prisma } from "./client";
import { getActiveModuleIdsForOrg } from "./organization";
import { completePaymentVerification } from "./provisioning";
import { getTenantPaymentIntegrator } from "./platform-payment";
import { isMockIntegrator, resolve } from "./integrator-credentials";

function paymentSecretsFromResolved(creds: {
  secrets: Record<string, string>;
  configPublic: Record<string, unknown>;
}): Record<string, string> {
  const merged: Record<string, string> = { ...creds.secrets };
  if (typeof creds.configPublic.apiUrl === "string" && creds.configPublic.apiUrl) {
    merged.apiUrl = creds.configPublic.apiUrl;
  }
  return merged;
}

async function resolvePaymentSecrets(
  integratorId: string,
  organizationId: string,
): Promise<Record<string, string> | undefined> {
  if (isMockIntegrator(integratorId)) return undefined;
  try {
    const creds = await resolve(integratorId, organizationId);
    return paymentSecretsFromResolved(creds);
  } catch {
    return undefined;
  }
}

export async function startPaymentValidation(
  organizationId: string,
  userEmail: string,
  userName: string,
): Promise<{
  integratorId: string;
  status: string;
  checkoutUrl?: string;
  verificationToken?: string;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) throw new Error("Organização não encontrada");

  const integratorId = await getTenantPaymentIntegrator(organizationId);
  const adapter = getPaymentAdapter(integratorId);
  if (!adapter) throw new Error(`Gateway ${integratorId} não disponível`);

  const moduleIds = await getActiveModuleIdsForOrg(organizationId);
  const centavos = calcularMensalidade(moduleIds);

  const integratorSecrets = await resolvePaymentSecrets(
    integratorId,
    organizationId,
  );

  const result = await adapter.criarValidacaoPagamento({
    tenantId: organizationId,
    customerEmail: userEmail,
    customerName: userName,
    valueCentavos: centavos || 4900,
    description: `Validação — ${org.name}`,
    integratorSecrets,
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      paymentIntegratorId: integratorId,
      paymentCustomerRef: result.customerRef,
      provisioningStatus:
        result.status === "verified" ? "trial" : "pending_payment",
    },
  });

  if (result.status === "verified") {
    await completePaymentVerification(organizationId);
  }

  return {
    integratorId,
    status: result.status,
    checkoutUrl: result.checkoutUrl,
    verificationToken: result.verificationToken,
  };
}

export async function handlePaymentWebhook(
  integratorId: string,
  payload: unknown,
): Promise<{ ok: boolean; organizationId?: string }> {
  const adapter = getPaymentAdapter(integratorId);
  if (!adapter) return { ok: false };

  const parsed = await adapter.confirmarWebhook(payload);
  if (!parsed.verified || !parsed.tenantId) {
    return { ok: false };
  }

  await prisma.organization.update({
    where: { id: parsed.tenantId },
    data: {
      paymentCustomerRef: parsed.customerRef ?? parsed.subscriptionRef,
    },
  });

  await completePaymentVerification(parsed.tenantId);
  return { ok: true, organizationId: parsed.tenantId };
}
