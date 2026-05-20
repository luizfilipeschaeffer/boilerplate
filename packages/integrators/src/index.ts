export type IntegratorTipo =
  | "payment"
  | "fiscal"
  | "messaging"
  | "social"
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

registerIntegrator({
  id: "fiscal-noop",
  tipo: "fiscal",
  modulosSuportados: ["fiscal-core"],
});
