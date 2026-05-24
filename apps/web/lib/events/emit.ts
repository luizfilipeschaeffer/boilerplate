import "server-only";

import { persistDomainEvent } from "@boilerplate/db";
import { getEventBus, createCorrelationId } from "@boilerplate/event-bus";
import { getEventVersion } from "@boilerplate/event-bus/catalog";
import type { DomainEvent as LegacyDomainEvent } from "@boilerplate/shared";
import { ensureServerModulesInitialized } from "@/lib/modules/init-server";

export async function emitAndPersist(event: LegacyDomainEvent): Promise<void> {
  ensureServerModulesInitialized();
  const ctx = {
    organizationId: event.organizationId,
    schemaName: event.schemaName,
    userId: "system",
    membershipId: "system",
    role: "system",
    branchId: null,
    departmentId: null,
    teamId: null,
  };

  await getEventBus().publish(
    {
      type: event.type,
      version: getEventVersion(event.type),
      organizationId: event.organizationId,
      correlationId: createCorrelationId(),
      payload: { ...event.payload, schemaName: event.schemaName },
      metadata: { source: "sync" },
    },
    ctx,
  );
}
