import type { DomainEvent, EventHandlerFn } from "@boilerplate/sdk-core";

export type PersistEventFn = (event: DomainEvent) => Promise<void>;

export type EventBusConfig = {
  redisUrl?: string;
  queuePrefix?: string;
  maxRetries?: number;
  persistEvent?: PersistEventFn;
  onHandlerError?: (error: Error, event: DomainEvent, handlerId: string) => void;
};

export type RegisteredHandler = {
  handlerId: string;
  eventType: string;
  eventVersion: string;
  async: boolean;
  fn: EventHandlerFn;
};

export type ReplayOptions = {
  from: Date;
  to: Date;
  types?: string[];
  organizationId?: string;
};

export type ReplaySource = (opts: ReplayOptions) => AsyncIterable<DomainEvent>;
