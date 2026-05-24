export interface PaymentSubscriptionInput {
  tenantId: string;
  customerEmail: string;
  customerName: string;
  valueCentavos: number;
  description: string;
  integratorSecrets?: Record<string, string>;
}

export interface PaymentSubscriptionResult {
  provider: "asaas" | "mock";
  subscriptionId: string;
  status: "active" | "pending";
  checkoutUrl?: string;
}

/**
 * Adapter Asaas (PRD §12). Sem credenciais configuradas opera em modo simulado.
 */
export async function createAsaasSubscription(
  input: PaymentSubscriptionInput,
): Promise<PaymentSubscriptionResult> {
  const apiKey = input.integratorSecrets?.apiKey?.trim();
  const baseUrl =
    input.integratorSecrets?.apiUrl?.trim() ??
    "https://sandbox.asaas.com/api/v3";

  if (!apiKey) {
    return {
      provider: "mock",
      subscriptionId: `mock_sub_${input.tenantId.slice(0, 8)}`,
      status: "active",
    };
  }

  const value = (input.valueCentavos / 100).toFixed(2);
  const res = await fetch(`${baseUrl}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify({
      customer: input.customerEmail,
      billingType: "UNDEFINED",
      value,
      cycle: "MONTHLY",
      description: input.description,
      externalReference: input.tenantId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id: string; status?: string };
  return {
    provider: "asaas",
    subscriptionId: data.id,
    status: data.status === "ACTIVE" ? "active" : "pending",
  };
}

export async function cancelAsaasSubscription(
  customerRef: string,
  integratorSecrets?: Record<string, string>,
): Promise<void> {
  const apiKey = integratorSecrets?.apiKey?.trim();
  if (!apiKey) return;
  const baseUrl =
    integratorSecrets?.apiUrl?.trim() ?? "https://sandbox.asaas.com/api/v3";
  await fetch(`${baseUrl}/subscriptions/${customerRef}`, {
    method: "DELETE",
    headers: { access_token: apiKey },
  });
}
