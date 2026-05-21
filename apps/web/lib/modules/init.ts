import { registerDomainEventHandlers } from "@/lib/events/register-handlers";
import { registerAllModules } from "./register-all";

let initialized = false;

export function ensureModulesRegistered(): void {
  if (initialized) return;
  registerAllModules();
  registerDomainEventHandlers();
  initialized = true;
}
