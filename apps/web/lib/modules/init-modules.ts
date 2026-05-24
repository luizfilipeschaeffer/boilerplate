import { registerAllModules } from "./register-all";

let modulesRegistered = false;

export function ensureModulesRegistered(): void {
  if (modulesRegistered) return;
  registerAllModules();
  modulesRegistered = true;
}
