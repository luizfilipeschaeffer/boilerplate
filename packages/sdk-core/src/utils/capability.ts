import type { ModuleCapabilities } from "../contracts/module";

export class CapabilityViolationError extends Error {
  constructor(
    public readonly capability: keyof ModuleCapabilities,
    public readonly moduleId: string,
  ) {
    super(`Module '${moduleId}' attempted to use undeclared capability: ${capability}`);
    this.name = "CapabilityViolationError";
  }
}

export function assertCapability(
  caps: ModuleCapabilities,
  required: keyof ModuleCapabilities,
  moduleId: string,
): void {
  if (!caps[required]) {
    throw new CapabilityViolationError(required, moduleId);
  }
}
