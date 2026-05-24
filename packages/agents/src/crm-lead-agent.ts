import type { DomainEvent, OrgBootContext } from "@boilerplate/sdk-core";
import { createAiRuntime, MockLlmAdapter } from "@boilerplate/ai-runtime";
import { createEventHandler, createEventPublisher } from "@boilerplate/sdk-events";

export type CrmLeadCreatedPayload = {
  leadId: string;
  name: string;
  email?: string;
};

export function registerCrmLeadAgent(): () => void {
  const publisher = createEventPublisher("agents/crm-lead");

  return createEventHandler(
    {
      handlerId: "crm-lead-agent-respond",
      eventType: "crm.lead.created",
      eventVersion: "^1.0.0",
      async: true,
      moduleId: "agents/crm-lead",
    },
    async (event: DomainEvent<CrmLeadCreatedPayload>, ctx: OrgBootContext) => {
      const ai = createAiRuntime(ctx.organizationId);
      const adapter = new MockLlmAdapter();

      const draft = await ai.complete(
        adapter,
        {
          messages: [
            {
              role: "user",
              content: `Draft a welcome email for lead ${event.payload.name} (${event.payload.email ?? "no email"})`,
            },
          ],
          maxTokens: 500,
        },
        {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          moduleId: "agents/crm-lead",
        },
      );

      await publisher.publish(
        {
          type: "messaging.email.send",
          version: "1.0.0",
          organizationId: ctx.organizationId,
          correlationId: event.correlationId,
          causationId: event.id,
          payload: {
            to: event.payload.email ?? "noreply@example.com",
            subject: `Welcome ${event.payload.name}`,
            body: draft.content,
          },
          metadata: { moduleId: "agents/crm-lead" },
        },
        ctx,
      );

      await publisher.publish(
        {
          type: "ai.usage.recorded",
          version: "1.0.0",
          organizationId: ctx.organizationId,
          correlationId: event.correlationId,
          causationId: event.id,
          payload: { tokens: draft.tokensUsed, model: draft.model },
          metadata: { moduleId: "agents/crm-lead" },
        },
        ctx,
      );

      await publisher.publish(
        {
          type: "billing.ai.tokens",
          version: "1.0.0",
          organizationId: ctx.organizationId,
          correlationId: event.correlationId,
          causationId: event.id,
          payload: { tokens: draft.tokensUsed, moduleId: "agents/crm-lead" },
          metadata: { moduleId: "agents/crm-lead" },
        },
        ctx,
      );
    },
  );
}

export * from "./crm-lead-agent";
