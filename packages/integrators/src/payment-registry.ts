import { paymentAsaasAdapter } from "./payment-asaas-adapter";
import { paymentMercadoPagoAdapter } from "./payment-mercadopago";
import { paymentMockAdapter } from "./payment-mock";
import { paymentStripeAdapter } from "./payment-stripe";
import type { PaymentGatewayAdapter } from "./payment-types";

const PAYMENT_ADAPTERS = new Map<string, PaymentGatewayAdapter>([
  [paymentMockAdapter.id, paymentMockAdapter],
  [paymentAsaasAdapter.id, paymentAsaasAdapter],
  [paymentStripeAdapter.id, paymentStripeAdapter],
  [paymentMercadoPagoAdapter.id, paymentMercadoPagoAdapter],
]);

export function getPaymentAdapter(
  integratorId: string,
): PaymentGatewayAdapter | undefined {
  return PAYMENT_ADAPTERS.get(integratorId);
}

export function listPaymentAdapterIds(): string[] {
  return [...PAYMENT_ADAPTERS.keys()];
}
