import { createEventHandler, createEventPublisher } from "@boilerplate/sdk-events";
import { createModuleContext } from "@boilerplate/sdk-server";
import { moduleContract } from "./contract";

export function registerExampleModuleHandlers(orgContext: Parameters<typeof createModuleContext>[0]["orgContext"]) {
  const publisher = createEventPublisher("example-module");
  const ctx = createModuleContext({
    moduleId: "example-module",
    capabilities: moduleContract.capabilities,
    orgContext,
  });

  const unregister = createEventHandler(
    {
      handlerId: "example-on-item-created",
      eventType: "example.item.created",
      eventVersion: "^1.0.0",
      async: true,
      moduleId: "example-module",
    },
    async (event) => {
      void ctx;
      await publisher.publish(
        {
          type: "example.item.created",
          version: "1.0.0",
          organizationId: event.organizationId,
          correlationId: event.correlationId,
          payload: { processed: true, itemId: (event.payload as { itemId?: string }).itemId },
          metadata: { moduleId: "example-module" },
        },
        orgContext,
      );
    },
  );

  return unregister;
}

export { moduleContract } from "./contract";
