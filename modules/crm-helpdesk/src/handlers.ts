import type { DomainEvent } from "@boilerplate/sdk-core";

/** Reindexação KB — implementação real no host via packages/db. */
export async function onKbPublished(
  _event: DomainEvent<Record<string, unknown>>,
): Promise<void> {
  // Host registra handler que chama reindexHelpdeskKb no tenant.
}

export async function onTicketCreated(
  _event: DomainEvent<Record<string, unknown>>,
): Promise<void> {
  // Host aplica automações via runHelpdeskAutomations.
}
