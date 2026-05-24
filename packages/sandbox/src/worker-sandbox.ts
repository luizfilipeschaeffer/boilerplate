import { Worker } from "node:worker_threads";
import type { TrustLevel } from "@boilerplate/sdk-core";
import { getQuotasForTrust, requiresWorkerIsolation } from "./runtime";

export type WorkerSandboxOptions = {
  modulePath: string;
  trust: TrustLevel;
  payload: unknown;
};

export async function runInWorkerSandbox<T>(opts: WorkerSandboxOptions): Promise<T> {
  if (!requiresWorkerIsolation(opts.trust)) {
    throw new Error("Worker sandbox only required for community/verified trust levels");
  }

  const quotas = getQuotasForTrust(opts.trust);

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker-entry.js", import.meta.url), {
      workerData: { modulePath: opts.modulePath, payload: opts.payload },
      resourceLimits: {
        maxOldGenerationSizeMb: quotas.maxMemoryMb,
      },
    });

    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Worker timeout after ${quotas.maxCpuMs}ms`));
    }, quotas.maxCpuMs);

    worker.on("message", (msg: { ok: true; result: T } | { ok: false; error: string }) => {
      clearTimeout(timer);
      if (msg.ok) resolve(msg.result);
      else reject(new Error(msg.error));
    });

    worker.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
