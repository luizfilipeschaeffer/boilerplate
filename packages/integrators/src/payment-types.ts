export interface PaymentValidationInput {
  tenantId: string;
  customerEmail: string;
  customerName: string;
  valueCentavos: number;
  description: string;
  /** Credenciais resolvidas server-side — nunca vêm do client. */
  integratorSecrets?: Record<string, string>;
}

export interface PaymentValidationResult {
  provider: string;
  integratorId: string;
  customerRef: string;
  status: "pending" | "verified" | "failed";
  checkoutUrl?: string;
  verificationToken?: string;
}

export interface PaymentWebhookResult {
  verified: boolean;
  tenantId?: string;
  customerRef?: string;
  subscriptionRef?: string;
}

export interface PaymentGatewayAdapter {
  id: string;
  criarValidacaoPagamento(
    input: PaymentValidationInput,
  ): Promise<PaymentValidationResult>;
  confirmarWebhook(payload: unknown): Promise<PaymentWebhookResult>;
  cancelar(
    customerRef: string,
    integratorSecrets?: Record<string, string>,
  ): Promise<void>;
}
