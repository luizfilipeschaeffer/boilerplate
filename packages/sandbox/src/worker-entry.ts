import { parentPort, workerData } from "node:worker_threads";

async function main(): Promise<void> {
  try {
    const { modulePath, payload } = workerData as {
      modulePath: string;
      payload: unknown;
    };
    void modulePath;
    void payload;
    parentPort?.postMessage({ ok: true, result: null });
  } catch (error) {
    parentPort?.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

void main();
