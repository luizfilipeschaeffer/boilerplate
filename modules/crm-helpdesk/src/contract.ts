import type { BoilerplateModule } from "@boilerplate/sdk-core";
import { mergeCapabilities } from "@boilerplate/sdk-core";

export const moduleContract: BoilerplateModule = {
  id: "crm-helpdesk",
  version: "0.1.0",
  coreContract: "^1.2.0",
  capabilities: mergeCapabilities({
    database: true,
    queues: true,
  }),
  requiredPermissions: [
    "crm-helpdesk.read",
    "crm-helpdesk.write",
    "crm-helpdesk.assign",
    "crm-helpdesk.kb.publish",
    "crm-helpdesk.admin",
  ],
  routes: [
    {
      path: "/helpdesk",
      label: "Help Desk",
      permission: "crm-helpdesk.read",
    },
    {
      path: "/helpdesk/kb",
      label: "Base de conhecimento",
      permission: "crm-helpdesk.read",
    },
    {
      path: "/helpdesk/portal",
      label: "Portal de suporte",
      permission: "crm-helpdesk.read",
    },
  ],
  eventHandlers: [
    {
      eventType: "crm-helpdesk.kb.published",
      eventVersion: "^1.0.0",
      handlerId: "crm-helpdesk-reindex-kb",
      async: true,
      moduleId: "crm-helpdesk",
    },
    {
      eventType: "crm-helpdesk.ticket.created",
      eventVersion: "^1.0.0",
      handlerId: "crm-helpdesk-on-ticket-created",
      async: true,
      moduleId: "crm-helpdesk",
    },
  ],
};
