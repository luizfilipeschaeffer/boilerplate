import "server-only";

import { registerCivilObrasEventHandlers } from "@/lib/civil-obras-event-handlers";
import { registerDomainEventHandlers } from "@/lib/events/register-handlers";
import { initEventBus } from "@/lib/events/event-bus-init";
import { configureCredentialResolver } from "@boilerplate/sdk-server";
import { resolve as resolveIntegratorCredentials } from "@boilerplate/db";
import { ensureModulesRegistered } from "./init-modules";

let serverInitialized = false;

export function ensureServerModulesInitialized(): void {
  if (serverInitialized) return;
  ensureModulesRegistered();
  configureCredentialResolver(resolveIntegratorCredentials);
  initEventBus();
  registerDomainEventHandlers();
  registerCivilObrasEventHandlers();
  serverInitialized = true;
}
