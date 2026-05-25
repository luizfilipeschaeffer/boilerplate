import type { OrgBootContext } from "./org-context";

export interface EventMetadata {
  moduleId?: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  source?: "sync" | "async" | "replay";
}

export interface DomainEvent<TPayload = unknown> {
  id: string;
  type: string;
  version: string;
  organizationId: string;
  branchId?: string;
  departmentId?: string;
  correlationId: string;
  causationId?: string;
  timestamp: Date;
  payload: TPayload;
  metadata: EventMetadata;
}

export interface EventHandlerRegistration {
  eventType: string;
  eventVersion: string;
  handlerId: string;
  async?: boolean;
  moduleId?: string;
}

export type EventHandlerFn<TPayload = unknown> = (
  event: DomainEvent<TPayload>,
  ctx: OrgBootContext,
) => void | Promise<void>;

export type EventPublisher = {
  publish<TPayload>(event: Omit<DomainEvent<TPayload>, "id" | "timestamp">): Promise<void>;
  publishSync<TPayload>(event: Omit<DomainEvent<TPayload>, "id" | "timestamp">): Promise<void>;
};
