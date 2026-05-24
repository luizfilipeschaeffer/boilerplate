import type {
  PaymentGatewayAdapter,
  PaymentValidationInput,
  PaymentValidationResult,
  PaymentWebhookResult,
} from "./payment-types";

export const paymentMercadoPagoAdapter: PaymentGatewayAdapter = {
  id: "payment-mercadopago",

  async criarValidacaoPagamento(
    input: PaymentValidationInput,
  ): Promise<PaymentValidationResult> {
    const token = input.integratorSecrets?.accessToken?.trim();
    if (!token) {
      return {
        provider: "mercadopago",
        integratorId: "payment-mercadopago",
        customerRef: `mp_mock_${input.tenantId.slice(0, 8)}`,
        status: "verified",
      };
    }

    const res = await fetch("https://api.mercadopago.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.customerEmail,
        first_name: input.customerName.split(" ")[0] ?? input.customerName,
        description: input.description,
        metadata: { tenant_id: input.tenantId },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mercado Pago: ${res.status} ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as { id: string };
    return {
      provider: "mercadopago",
      integratorId: "payment-mercadopago",
      customerRef: String(data.id),
      status: "pending",
    };
  },

  async confirmarWebhook(payload: unknown): Promise<PaymentWebhookResult> {
    const p = payload as {
      action?: string;
      data?: { id?: string };
      metadata?: { tenant_id?: string };
    };
    if (p.action === "card.updated" || p.action === "customer.created") {
      return {
        verified: true,
        tenantId: p.metadata?.tenant_id,
        customerRef: p.data?.id ? String(p.data.id) : undefined,
      };
    }
    return { verified: false };
  },

  async cancelar(): Promise<void> {},
};
