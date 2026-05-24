import type { DomainEvent, OrgBootContext } from "@boilerplate/sdk-core";
import type { EventBusConfig, RegisteredHandler, ReplayOptions, ReplaySource } from "./types";
import { handlerSupportsEventVersion, normalizeEvent } from "./utils";

const syncHandlers = new Map<string, Set<RegisteredHandler>>();
const asyncHandlers = new Map<string, Set<RegisteredHandler>>();

export function registerHandler(handler: RegisteredHandler): () => void {
  const map = handler.async ? asyncHandlers : syncHandlers;
  if (!map.has(handler.eventType)) map.set(handler.eventType, new Set());
  map.get(handler.eventType)!.add(handler);
  return () => map.get(handler.eventType)?.delete(handler);
}

async function runSyncHandlers(
  event: DomainEvent,
  ctx: OrgBootContext,
  config: EventBusConfig,
): Promise<void> {
  const set = syncHandlers.get(event.type);
  if (!set) return;
  for (const h of set) {
    if (!handlerSupportsEventVersion(h.eventVersion, event.version)) continue;
    try {
      await h.fn(event, ctx);
    } catch (err) {
      config.onHandlerError?.(err as Error, event, h.handlerId);
      throw err;
    }
  }
}

export function createEventBus(config: EventBusConfig = {}) {
  const maxRetries = config.maxRetries ?? 5;
  let queue: import("bullmq").Queue | null = null;
  let worker: import("bullmq").Worker | null = null;
  let dlq: import("bullmq").Queue | null = null;

  async function ensureQueue() {
    if (queue) return queue;
    const redisUrl = config.redisUrl ?? process.env.REDIS_URL;
    if (!redisUrl) return null;

    const { Queue, Worker } = await import("bullmq");
    const prefix = config.queuePrefix ?? "boilerplate:events";
    const connection = { url: redisUrl };

    queue = new Queue(`${prefix}:main`, { connection });
    dlq = new Queue(`${prefix}:dlq`, { connection });

    worker = new Worker(
      `${prefix}:main`,
      async (job) => {
        const { event, ctx } = job.data as { event: DomainEvent; ctx: OrgBootContext };
        const set = asyncHandlers.get(event.type);
        if (!set) return;
        for (const h of set) {
          if (!handlerSupportsEventVersion(h.eventVersion, event.version)) continue;
          await h.fn(event, ctx);
        }
      },
      { connection },
    );

    worker.on("failed", async (job, err) => {
      if (!job || !dlq) return;
      const attempts = job.opts.attempts ?? maxRetries;
      if (job.attemptsMade >= attempts) {
        await dlq.add("dead", {
          event: job.data.event,
          error: err.message,
          failedAt: new Date().toISOString(),
        });
      }
    });

    return queue;
  }

  return {
    registerHandler,

    async publish<TPayload>(
      partial: Omit<DomainEvent<TPayload>, "id" | "timestamp">,
      ctx: OrgBootContext,
    ): Promise<DomainEvent<TPayload>> {
      const event = normalizeEvent(partial);
      if (config.persistEvent) await config.persistEvent(event);
      await runSyncHandlers(event, ctx, config);

      const q = await ensureQueue();
      const asyncSet = asyncHandlers.get(event.type);
      if (q && asyncSet && asyncSet.size > 0) {
        await q.add(event.type, { event, ctx }, {
          attempts: maxRetries,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: 1000,
        });
      }
      return event;
    },

    async publishSync<TPayload>(
      partial: Omit<DomainEvent<TPayload>, "id" | "timestamp">,
      ctx: OrgBootContext,
    ): Promise<DomainEvent<TPayload>> {
      const event = normalizeEvent({ ...partial, metadata: { ...partial.metadata, source: "sync" } });
      if (config.persistEvent) await config.persistEvent(event);
      await runSyncHandlers(event, ctx, config);
      return event;
    },

    async replay(source: ReplaySource, opts: ReplayOptions, ctx: OrgBootContext): Promise<number> {
      let count = 0;
      for await (const event of source(opts)) {
        await this.publish(event, ctx);
        count++;
      }
      return count;
    },

    async close(): Promise<void> {
      await worker?.close();
      await queue?.close();
      await dlq?.close();
      worker = null;
      queue = null;
      dlq = null;
    },
  };
}

export type EventBus = ReturnType<typeof createEventBus>;

let defaultBus: EventBus | null = null;

export function getEventBus(config?: EventBusConfig): EventBus {
  if (!defaultBus) defaultBus = createEventBus(config);
  return defaultBus;
}

export async function emitDomainEvent(
  partial: Omit<DomainEvent, "id" | "timestamp">,
  ctx: OrgBootContext,
): Promise<DomainEvent> {
  return getEventBus().publish(partial, ctx);
}

export function onDomainEvent(
  registration: Omit<RegisteredHandler, "fn"> & { fn: RegisteredHandler["fn"] },
): () => void {
  return getEventBus().registerHandler(registration as RegisteredHandler);
}
