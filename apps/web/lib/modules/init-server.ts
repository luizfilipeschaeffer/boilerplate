import "server-only";

import { registerDomainEventHandlers } from "@/lib/events/register-handlers";
import { initEventBus } from "@/lib/events/event-bus-init";
import { ensureModulesRegistered } from "./init-modules";

let serverInitialized = false;

export function ensureServerModulesInitialized(): void {
  if (serverInitialized) return;
  ensureModulesRegistered();
  initEventBus();
  registerDomainEventHandlers();
  serverInitialized = true;
}
