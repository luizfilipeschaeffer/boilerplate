import type {
  PaymentGatewayAdapter,
  PaymentValidationInput,
  PaymentValidationResult,
  PaymentWebhookResult,
} from "./payment-types";

export const paymentStripeAdapter: PaymentGatewayAdapter = {
  id: "payment-stripe",

  async criarValidacaoPagamento(
    input: PaymentValidationInput,
  ): Promise<PaymentValidationResult> {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      return {
        provider: "stripe",
        integratorId: "payment-stripe",
        customerRef: `stripe_mock_${input.tenantId.slice(0, 8)}`,
        status: "verified",
      };
    }

    const res = await fetch("https://api.stripe.com/v1/setup_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "metadata[tenant_id]": input.tenantId,
        usage: "off_session",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      id: string;
      client_secret?: string;
      status?: string;
    };

    return {
      provider: "stripe",
      integratorId: "payment-stripe",
      customerRef: data.id,
      status: data.status === "succeeded" ? "verified" : "pending",
      verificationToken: data.client_secret,
    };
  },

  async confirmarWebhook(payload: unknown): Promise<PaymentWebhookResult> {
    const p = payload as {
      type?: string;
      data?: { object?: { metadata?: { tenant_id?: string }; id?: string } };
    };
    if (p.type === "setup_intent.succeeded") {
      const tenantId = p.data?.object?.metadata?.tenant_id;
      return {
        verified: true,
        tenantId,
        customerRef: p.data?.object?.id,
        subscriptionRef: p.data?.object?.id,
      };
    }
    return { verified: false };
  },

  async cancelar(): Promise<void> {},
};
