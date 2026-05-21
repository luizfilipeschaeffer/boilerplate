import { persistDomainEvent } from "@boilerplate/db";
import { emitDomainEvent, type DomainEvent } from "@boilerplate/shared";

export async function emitAndPersist(event: DomainEvent): Promise<void> {
  await persistDomainEvent({
    organizationId: event.organizationId,
    eventType: event.type,
    payload: event.payload,
  });
  await emitDomainEvent(event);
}
