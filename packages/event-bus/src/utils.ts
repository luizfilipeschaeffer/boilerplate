import { randomUUID } from "node:crypto";
import type { DomainEvent, EventMetadata } from "@boilerplate/sdk-core";
import { satisfiesSemverRange } from "@boilerplate/sdk-core";

export function createEventId(): string {
  return randomUUID();
}

export function createCorrelationId(existing?: string): string {
  return existing ?? randomUUID();
}

export function withTraceMetadata(
  metadata: EventMetadata,
  trace?: { traceId?: string; spanId?: string },
): EventMetadata {
  return {
    ...metadata,
    traceId: trace?.traceId ?? metadata.traceId,
    spanId: trace?.spanId ?? metadata.spanId,
  };
}

export function normalizeEvent<TPayload>(
  partial: Omit<DomainEvent<TPayload>, "id" | "timestamp"> & { id?: string; timestamp?: Date },
): DomainEvent<TPayload> {
  return {
  ...partial,
  id: partial.id ?? createEventId(),
  timestamp: partial.timestamp ?? new Date(),
  metadata: partial.metadata ?? {},
  };
}

export function handlerSupportsEventVersion(
  handlerVersion: string,
  eventVersion: string,
): boolean {
  return satisfiesSemverRange(eventVersion, handlerVersion);
}
