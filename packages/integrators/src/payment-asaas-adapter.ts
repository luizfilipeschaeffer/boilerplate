import type {
  PaymentGatewayAdapter,
  PaymentValidationInput,
  PaymentValidationResult,
  PaymentWebhookResult,
} from "./payment-types";
import { cancelAsaasSubscription, createAsaasSubscription } from "./payment-asaas";

export const paymentAsaasAdapter: PaymentGatewayAdapter = {
  id: "payment-asaas",

  async criarValidacaoPagamento(
    input: PaymentValidationInput,
  ): Promise<PaymentValidationResult> {
    const sub = await createAsaasSubscription(input);
    return {
      provider: sub.provider,
      integratorId: "payment-asaas",
      customerRef: sub.subscriptionId,
      status: sub.status === "active" ? "verified" : "pending",
      checkoutUrl: sub.checkoutUrl,
    };
  },

  async confirmarWebhook(payload: unknown): Promise<PaymentWebhookResult> {
    const p = payload as {
      event?: string;
      payment?: { externalReference?: string; status?: string };
    };
    if (
      p.event === "PAYMENT_CONFIRMED" ||
      p.payment?.status === "CONFIRMED"
    ) {
      return {
        verified: true,
        tenantId: p.payment?.externalReference,
        subscriptionRef: p.payment?.externalReference,
      };
    }
    return { verified: false };
  },

  async cancelar(
    customerRef: string,
    integratorSecrets?: Record<string, string>,
  ): Promise<void> {
    await cancelAsaasSubscription(customerRef, integratorSecrets);
  },
};
