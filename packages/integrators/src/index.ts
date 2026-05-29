export type IntegratorTipo =
  | "payment"
  | "fiscal"
  | "messaging"
  | "social"
  | "storage"
  | "webhook";

export interface IntegratorDefinition {
  id: string;
  tipo: IntegratorTipo;
  modulosSuportados: string[];
}

const INTEGRATOR_REGISTRY = new Map<string, IntegratorDefinition>();

export function registerIntegrator(def: IntegratorDefinition): void {
  INTEGRATOR_REGISTRY.set(def.id, def);
}

export function getIntegrator(id: string): IntegratorDefinition | undefined {
  return INTEGRATOR_REGISTRY.get(id);
}

registerIntegrator({
  id: "payment-mock",
  tipo: "payment",
  modulosSuportados: ["*"],
});

export {
  createAsaasSubscription,
  type PaymentSubscriptionInput,
  type PaymentSubscriptionResult,
} from "./payment-asaas";

registerIntegrator({
  id: "payment-asaas",
  tipo: "payment",
  modulosSuportados: ["*"],
});

registerIntegrator({
  id: "payment-stripe",
  tipo: "payment",
  modulosSuportados: ["*"],
});

registerIntegrator({
  id: "payment-mercadopago",
  tipo: "payment",
  modulosSuportados: ["*"],
});

export * from "./payment-types";
export {
  getPaymentAdapter,
  listPaymentAdapterIds,
} from "./payment-registry";
export { paymentMockAdapter } from "./payment-mock";

registerIntegrator({
  id: "fiscal-noop",
  tipo: "fiscal",
  modulosSuportados: ["fiscal-core"],
});

registerIntegrator({
  id: "email-resend-mock",
  tipo: "messaging",
  modulosSuportados: ["platform-comms"],
});

registerIntegrator({
  id: "social-whatsapp-mock",
  tipo: "social",
  modulosSuportados: ["platform-comms"],
});

registerIntegrator({
  id: "social-telegram-mock",
  tipo: "social",
  modulosSuportados: ["platform-comms"],
});

registerIntegrator({
  id: "storage-s3-mock",
  tipo: "storage",
  modulosSuportados: ["civil-obras", "*"],
});

export { createStorageS3Adapter, presignUploadUrl } from "./storage-s3";
