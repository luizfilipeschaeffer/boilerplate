import type {
  PaymentGatewayAdapter,
  PaymentValidationInput,
  PaymentValidationResult,
  PaymentWebhookResult,
} from "./payment-types";

export const paymentMockAdapter: PaymentGatewayAdapter = {
  id: "payment-mock",

  async criarValidacaoPagamento(
    input: PaymentValidationInput,
  ): Promise<PaymentValidationResult> {
    return {
      provider: "mock",
      integratorId: "payment-mock",
      customerRef: `mock_cust_${input.tenantId.slice(0, 8)}`,
      status: "pending",
      verificationToken: `mock_verify_${input.tenantId}`,
      checkoutUrl: `/configuracoes/cobranca?mock=1&tenant=${input.tenantId}`,
    };
  },

  async confirmarWebhook(payload: unknown): Promise<PaymentWebhookResult> {
    const p = payload as Record<string, unknown>;
    const tenantId =
      typeof p.tenantId === "string" ? p.tenantId : undefined;
    const event =
      typeof p.event === "string" ? p.event : "payment.confirmed";
    if (event !== "payment.confirmed" || !tenantId) {
      return { verified: false };
    }
    return {
      verified: true,
      tenantId,
      customerRef:
        typeof p.customerRef === "string" ? p.customerRef : undefined,
      subscriptionRef:
        typeof p.subscriptionRef === "string"
          ? p.subscriptionRef
          : `mock_sub_${tenantId.slice(0, 8)}`,
    };
  },

  async cancelar(): Promise<void> {},
};
