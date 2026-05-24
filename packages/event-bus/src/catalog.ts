import type { DomainEvent } from "@boilerplate/sdk-core";

export const OFFICIAL_EVENT_CATALOG = {
  "venda.confirmada": { version: "1.0.0", module: "core-vendas" },
  "venda.cancelada": { version: "1.0.0", module: "core-vendas" },
  "estoque.baixo": { version: "1.0.0", module: "core-estoque" },
  "cliente.criado": { version: "1.0.0", module: "core-clientes" },
  "item.criado": { version: "1.0.0", module: "core-catalogo" },
  "missao.concluida": { version: "1.0.0", module: "aprendiz" },
  "pedido.convertido": { version: "1.0.0", module: "core-vendas" },
  "crm.lead.created": { version: "1.0.0", module: "core-crm" },
  "crm.lead.criado": { version: "1.0.0", module: "core-crm", deprecated: "crm.lead.created" },
  "crm.deal.created": { version: "1.0.0", module: "core-crm" },
  "crm.deal.criado": { version: "1.0.0", module: "core-crm", deprecated: "crm.deal.created" },
  "crm.deal.etapa_alterada": { version: "1.0.0", module: "core-crm" },
  "crm.nota.criada": { version: "1.0.0", module: "core-crm" },
  "crm.lead.mesclado": { version: "1.0.0", module: "core-crm" },
  "crm.lead.atualizado": { version: "1.0.0", module: "core-crm" },
  "ordem_compra.criada": { version: "1.0.0", module: "core-compras" },
  "ordem_compra.enviada": { version: "1.0.0", module: "core-compras" },
  "compra.recebida": { version: "1.0.0", module: "core-compras" },
  "estoque.reposicao_sugerida": { version: "1.0.0", module: "core-estoque" },
  "messaging.email.send": { version: "1.0.0", module: "integrator-messaging" },
  "ai.usage.recorded": { version: "1.0.0", module: "ai-runtime" },
  "billing.ai.tokens": { version: "1.0.0", module: "billing" },
  "example.item.created": { version: "1.0.0", module: "example-module" },
} as const;

export type OfficialEventType = keyof typeof OFFICIAL_EVENT_CATALOG;

export function isOfficialEventType(type: string): type is OfficialEventType {
  return type in OFFICIAL_EVENT_CATALOG;
}

export function getEventVersion(type: string): string {
  const entry = OFFICIAL_EVENT_CATALOG[type as OfficialEventType];
  return entry?.version ?? "1.0.0";
}
