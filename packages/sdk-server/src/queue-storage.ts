import type { ModuleCapabilities } from "@boilerplate/sdk-core";
import { assertCapability } from "@boilerplate/sdk-core";

export type JobPayload = Record<string, unknown>;

export type JobQueue = {
  add(name: string, payload: JobPayload): Promise<{ id: string }>;
};

const queues = new Map<string, JobPayload[]>();

export function createJobQueue(moduleId: string, caps: ModuleCapabilities): JobQueue {
  assertCapability(caps, "queues", moduleId);
  if (!queues.has(moduleId)) queues.set(moduleId, []);

  return {
    async add(name, payload) {
      const id = `${moduleId}:${name}:${Date.now()}`;
      queues.get(moduleId)!.push({ id, name, ...payload });
      return { id };
    },
  };
}

export type QueueFactory = ReturnType<typeof createJobQueue>;

export function createStorage(moduleId: string, caps: ModuleCapabilities) {
  assertCapability(caps, "storage", moduleId);
  const store = new Map<string, Buffer>();

  return {
    async put(key: string, data: Buffer) {
      store.set(`${moduleId}:${key}`, data);
      return { key };
    },
    async get(key: string) {
      return store.get(`${moduleId}:${key}`) ?? null;
    },
  };
}

export type StorageClient = ReturnType<typeof createStorage>;

export function createHttpClient(moduleId: string, caps: ModuleCapabilities) {
  assertCapability(caps, "externalHttp", moduleId);

  return {
    async fetch(url: string, init?: RequestInit) {
      return fetch(url, init);
    },
  };
}
