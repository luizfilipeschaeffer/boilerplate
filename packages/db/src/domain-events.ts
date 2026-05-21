import { prisma } from "./client";

export type DomainEventType =
  | "venda.confirmada"
  | "venda.cancelada"
  | "estoque.baixo"
  | "cliente.criado"
  | "item.criado"
  | "missao.concluida";

export async function persistDomainEvent(input: {
  organizationId: string;
  eventType: DomainEventType;
  payload: Record<string, unknown>;
}): Promise<void> {
  await prisma.domainEvent.create({
    data: {
      organizationId: input.organizationId,
      eventType: input.eventType,
      payload: input.payload as object,
    },
  });
}
