import { registerAllModules } from "./register-all";

let initialized = false;

export function ensureModulesRegistered(): void {
  if (initialized) return;
  registerAllModules();
  initialized = true;
}
