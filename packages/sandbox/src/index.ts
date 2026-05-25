import type { ModuleManifest } from "@boilerplate/sdk-core";
import { createModuleRuntime, guardCapability } from "./runtime";
import { runInWorkerSandbox } from "./worker-sandbox";

export * from "./runtime";
export * from "./worker-sandbox";
export * from "./manifest-verify";

export async function executeModuleHandler<T>(
  manifest: ModuleManifest,
  scope: Parameters<typeof createModuleRuntime>[1],
  handler: () => Promise<T>,
): Promise<T> {
  if (manifest.trustLevel === "community" || manifest.trustLevel === "verified") {
    return runInWorkerSandbox({
      modulePath: manifest.npmPackage,
      trust: manifest.trustLevel,
      payload: { scope },
    });
  }
  guardCapability(manifest.capabilities, "database", manifest.id);
  return handler();
}

export { createModuleRuntime, guardCapability };
