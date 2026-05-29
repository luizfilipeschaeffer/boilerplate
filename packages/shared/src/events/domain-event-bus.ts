/** @deprecated Use @boilerplate/event-bus — bridge for backward compatibility */
export type DomainEventType =
  | "venda.confirmada"
  | "venda.cancelada"
  | "estoque.baixo"
  | "cliente.criado"
  | "item.criado"
  | "missao.concluida"
  | "pedido.convertido"
  | "crm.lead.criado"
  | "crm.deal.criado"
  | "crm.deal.etapa_alterada"
  | "crm.nota.criada"
  | "crm.lead.mesclado"
  | "crm.lead.atualizado"
  | "ordem_compra.criada"
  | "ordem_compra.enviada"
  | "compra.recebida"
  | "estoque.reposicao_sugerida"
  | "crm-helpdesk.ticket.created"
  | "crm-helpdesk.ticket.assigned"
  | "crm-helpdesk.ticket.resolved"
  | "crm-helpdesk.ticket.closed"
  | "crm-helpdesk.kb.published"
  | "crm.ticket.encerrado";

/** Legacy shape — bridged to @boilerplate/event-bus */
export interface DomainEvent<T extends DomainEventType = DomainEventType> {
  type: T;
  organizationId: string;
  schemaName: string;
  payload: Record<string, unknown>;
}

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

import { registerHandler, getEventBus } from "@boilerplate/event-bus";
import { createCorrelationId } from "@boilerplate/event-bus";
import { getEventVersion } from "@boilerplate/event-bus/catalog";

function toOrgBootContext(event: DomainEvent) {
  return {
    organizationId: event.organizationId,
    schemaName: event.schemaName,
    userId: "system",
    membershipId: "system",
    role: "system",
    branchId: null,
    departmentId: null,
    teamId: null,
  };
}

export function onDomainEvent(
  type: DomainEventType,
  handler: DomainEventHandler,
): () => void {
  return registerHandler({
    handlerId: `legacy:${type}`,
    eventType: type,
    eventVersion: "^1.0.0",
    async: false,
    fn: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      await handler({
        type: event.type as DomainEventType,
        organizationId: event.organizationId,
        schemaName: (payload.schemaName as string) ?? "",
        payload,
      });
    },
  });
}

export async function emitDomainEvent(event: DomainEvent): Promise<void> {
  await getEventBus().publish(
    {
      type: event.type,
      version: getEventVersion(event.type),
      organizationId: event.organizationId,
      correlationId: createCorrelationId(),
      payload: { ...event.payload, schemaName: event.schemaName },
      metadata: { source: "sync" },
    },
    toOrgBootContext(event),
  );
}
