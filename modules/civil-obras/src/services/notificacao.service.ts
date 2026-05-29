import type { ModuleServerContext } from "@boilerplate/sdk-server";
import { createJobQueue } from "@boilerplate/sdk-server";
import { moduleContract } from "../contract";

export type EmailJobPayload = {
  to: string;
  subject: string;
  body: string;
  organizationId: string;
};

export type WhatsappJobPayload = {
  to: string;
  body: string;
  organizationId: string;
};

export function createNotificacaoService(ctx: ModuleServerContext) {
  const queue = createJobQueue(ctx.moduleId, moduleContract.capabilities);

  return {
    async enqueueEmail(payload: EmailJobPayload) {
      return queue.add("civil-obras.email", payload as Record<string, unknown>);
    },
    async enqueueWhatsapp(payload: WhatsappJobPayload) {
      return queue.add("civil-obras.whatsapp", payload as Record<string, unknown>);
    },
  };
}
