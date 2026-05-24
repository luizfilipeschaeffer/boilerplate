import type { OrgBootContext } from "@boilerplate/sdk-core";

export type WorkflowStep =
  | { type: "action"; name: string; run: (ctx: OrgBootContext, input: unknown) => Promise<unknown> }
  | { type: "emit"; eventType: string; mapPayload: (input: unknown) => Record<string, unknown> }
  | { type: "integrator"; integratorId: string; action: string }
  | { type: "delay"; ms: number };

export type WorkflowDefinition = {
  id: string;
  trigger: { eventType: string; eventVersion: string };
  steps: WorkflowStep[];
  timeoutMs?: number;
  maxRetries?: number;
  compensate?: (ctx: OrgBootContext, input: unknown, error: Error) => Promise<void>;
};

export async function runWorkflow(
  def: WorkflowDefinition,
  ctx: OrgBootContext,
  input: unknown,
): Promise<unknown> {
  const timeout = def.timeoutMs ?? 30_000;
  const retries = def.maxRetries ?? 3;
  let lastError: Error | null = null;
  let current = input;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      for (const step of def.steps) {
        const stepPromise = (async () => {
          switch (step.type) {
            case "action":
              current = await step.run(ctx, current);
              break;
            case "emit":
              current = { eventType: step.eventType, payload: step.mapPayload(current) };
              break;
            case "integrator":
              current = { integratorId: step.integratorId, action: step.action, input: current };
              break;
            case "delay":
              await new Promise((r) => setTimeout(r, step.ms));
              break;
          }
        })();
        current = await Promise.race([
          stepPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Workflow step timeout")), timeout),
          ),
        ]);
      }
      return current;
    } catch (err) {
      lastError = err as Error;
      if (def.compensate) await def.compensate(ctx, input, lastError);
    }
  }
  throw lastError ?? new Error("Workflow failed");
}
