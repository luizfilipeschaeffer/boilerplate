import type { DomainEvent, OrgBootContext } from "@boilerplate/sdk-core";
import { createEventId, createCorrelationId } from "@boilerplate/event-bus";
import { getEventBus } from "@boilerplate/event-bus";
import { injectTraceContext } from "@boilerplate/observability";

export function createEventPublisher(moduleId: string) {
  return {
    async publish<TPayload>(
      partial: Omit<DomainEvent<TPayload>, "id" | "timestamp" | "metadata"> & {
        metadata?: DomainEvent<TPayload>["metadata"];
      },
      ctx: OrgBootContext,
    ) {
      const trace = injectTraceContext();
      return getEventBus().publish(
        {
          ...partial,
          correlationId: partial.correlationId ?? createCorrelationId(),
          metadata: {
            moduleId,
            userId: ctx.userId,
            ...partial.metadata,
            ...trace,
          },
        },
        ctx,
      );
    },
  };
}

export type EventPublisher = ReturnType<typeof createEventPublisher>;

export { createEventId, createCorrelationId };
