import type {
  DomainEvent,
  EventHandlerFn,
  EventHandlerRegistration,
  OrgBootContext,
} from "@boilerplate/sdk-core";
import { registerHandler } from "@boilerplate/event-bus";
import { createEventPublisher } from "@boilerplate/sdk-server";
import { withSpan, injectTraceContext } from "@boilerplate/observability";
import { randomUUID } from "node:crypto";

export { createEventPublisher };

export type RegisteredHandler = EventHandlerRegistration & {
  fn: EventHandlerFn;
};

export function createEventHandler<TPayload>(
  reg: EventHandlerRegistration,
  fn: EventHandlerFn<TPayload>,
): () => void {
  return registerHandler({
    handlerId: reg.handlerId,
    eventType: reg.eventType,
    eventVersion: reg.eventVersion,
    async: reg.async ?? true,
    fn: async (event, ctx) => {
      await withSpan(
        `event.handler.${reg.moduleId ?? "unknown"}.${reg.handlerId}`,
        async () => {
          await fn(event as DomainEvent<TPayload>, ctx);
        },
        {
          eventType: reg.eventType,
          correlationId: event.correlationId,
          ...injectTraceContext(),
        },
      );
    },
  });
}

export function withCorrelation<T>(fn: () => T, correlationId?: string): T {
  const id = correlationId ?? randomUUID();
  return fn();
}

export type { OrgBootContext };
export { OFFICIAL_EVENT_CATALOG, type OfficialEventType } from "@boilerplate/event-bus";
