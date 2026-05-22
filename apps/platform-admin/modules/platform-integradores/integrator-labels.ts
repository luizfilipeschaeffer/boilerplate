import type { IntegratorImplementationStatus } from "@boilerplate/db";

export const INTEGRATOR_TIPO_LABELS: Record<string, string> = {
  payment: "Pagamento",
  fiscal: "Fiscal",
  messaging: "Mensagens",
  social: "Redes sociais",
  webhook: "Webhook",
};

export const INTEGRATOR_STATUS_LABELS: Record<
  IntegratorImplementationStatus,
  string
> = {
  implemented: "Implementado",
  scaffold: "Em desenvolvimento",
  planned: "Planejado",
};

export function formatIntegratorTipo(tipo: string): string {
  return INTEGRATOR_TIPO_LABELS[tipo] ?? tipo;
}
