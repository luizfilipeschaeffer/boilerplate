import type { ModuleCapabilities } from "../contracts/module";

export const FORBIDDEN_CAPABILITIES = {
  filesystem: false,
  processEnv: false,
  crossTenant: false,
} as const satisfies Pick<
  ModuleCapabilities,
  "filesystem" | "processEnv" | "crossTenant"
>;

export function assertValidCapabilities(caps: ModuleCapabilities): void {
  if (caps.filesystem !== false && caps.filesystem !== undefined) {
    throw new Error("Capability 'filesystem' is forbidden");
  }
  if (caps.processEnv !== false && caps.processEnv !== undefined) {
    throw new Error("Capability 'processEnv' is forbidden");
  }
  if (caps.crossTenant !== false && caps.crossTenant !== undefined) {
    throw new Error("Capability 'crossTenant' is forbidden");
  }
}

export function mergeCapabilities(
  declared: ModuleCapabilities,
): ModuleCapabilities {
  return {
    ...declared,
    ...FORBIDDEN_CAPABILITIES,
  };
}
