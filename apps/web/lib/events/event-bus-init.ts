import "server-only";

import { getEventBus } from "@boilerplate/event-bus";
import { persistDomainEvent } from "@boilerplate/db";
import { setupOtel } from "@boilerplate/observability";

let initialized = false;

export function initEventBus(): void {
  if (initialized) return;
  initialized = true;

  setupOtel({
    serviceName: "boilerplate-web",
    enabled: process.env.OTEL_ENABLED === "true",
  });

  getEventBus({
    redisUrl: process.env.REDIS_URL,
    persistEvent: async (event) => {
      await persistDomainEvent({
        organizationId: event.organizationId,
        eventType: event.type as Parameters<typeof persistDomainEvent>[0]["eventType"],
        payload: event.payload as Record<string, unknown>,
      });
    },
  });
}
