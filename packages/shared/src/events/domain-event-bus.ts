export type DomainEventType =
  | "venda.confirmada"
  | "venda.cancelada"
  | "estoque.baixo"
  | "cliente.criado"
  | "item.criado"
  | "missao.concluida";

export interface DomainEvent<T extends DomainEventType = DomainEventType> {
  type: T;
  organizationId: string;
  schemaName: string;
  payload: Record<string, unknown>;
}

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Map<DomainEventType, Set<DomainEventHandler>>();

export function onDomainEvent(
  type: DomainEventType,
  handler: DomainEventHandler,
): () => void {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => handlers.get(type)?.delete(handler);
}

export async function emitDomainEvent(event: DomainEvent): Promise<void> {
  const set = handlers.get(event.type);
  if (!set) return;
  for (const handler of set) {
    await handler(event);
  }
}
