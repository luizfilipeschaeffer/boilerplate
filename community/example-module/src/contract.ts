import type { BoilerplateModule } from "@boilerplate/sdk-core";
import { mergeCapabilities } from "@boilerplate/sdk-core";

export const moduleContract: BoilerplateModule = {
  id: "example-module",
  version: "0.1.0",
  coreContract: "^1.2.0",
  segment: ["ecommerce"],
  capabilities: mergeCapabilities({
    database: true,
    queues: true,
  }),
  requiredPermissions: ["example-module.read", "example-module.write"],
  routes: [{ path: "/example", label: "Example", permission: "example-module.read" }],
  eventHandlers: [
    {
      eventType: "example.item.created",
      eventVersion: "^1.0.0",
      handlerId: "example-on-item-created",
      async: true,
      moduleId: "example-module",
    },
  ],
};
