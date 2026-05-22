import type {
  PaymentGatewayAdapter,
  PaymentValidationInput,
  PaymentValidationResult,
  PaymentWebhookResult,
} from "./payment-types";
import { createAsaasSubscription } from "./payment-asaas";

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

  async cancelar(customerRef: string): Promise<void> {
    const apiKey = process.env.ASAAS_API_KEY?.trim();
    if (!apiKey) return;
    const baseUrl =
      process.env.ASAAS_API_URL?.trim() ?? "https://sandbox.asaas.com/api/v3";
    await fetch(`${baseUrl}/subscriptions/${customerRef}`, {
      method: "DELETE",
      headers: { access_token: apiKey },
    });
  },
};
