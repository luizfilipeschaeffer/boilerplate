export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmRequest = {
  messages: LlmMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type LlmResponse = {
  content: string;
  tokensUsed: number;
  model: string;
};

export type TenantAiContext = {
  organizationId: string;
  userId: string;
  moduleId: string;
  systemPromptSuffix?: string;
};

export interface LlmAdapter {
  complete(req: LlmRequest, ctx: TenantAiContext): Promise<LlmResponse>;
}

export interface VectorStore {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  query(vector: number[], topK: number): Promise<{ id: string; score: number; metadata: Record<string, unknown> }[]>;
  delete(id: string): Promise<void>;
}

export interface MemoryLayer {
  getThread(orgId: string, userId: string, threadId: string): Promise<LlmMessage[]>;
  append(orgId: string, userId: string, threadId: string, message: LlmMessage): Promise<void>;
  clear(orgId: string, userId: string, threadId: string): Promise<void>;
}

export type AiBudget = {
  dailyTokenLimit: number;
  usedToday: number;
  hardLimit: boolean;
};

const orgBudgets = new Map<string, AiBudget>();
const orgMemories = new Map<string, LlmMessage[]>();

export class MockLlmAdapter implements LlmAdapter {
  async complete(req: LlmRequest, ctx: TenantAiContext): Promise<LlmResponse> {
    const systemMessages = req.messages.filter((m) => m.role === "system");
    if (systemMessages.some((m) => m.content.includes(ctx.organizationId) === false && m.content.includes("ORG:"))) {
      throw new Error("System prompt tenant isolation violation");
    }
    return {
      content: `[mock] ${req.messages.at(-1)?.content ?? ""}`,
      tokensUsed: 42,
      model: req.model ?? "mock",
    };
  }
}

export function createAiRuntime(orgId: string, opts?: { dailyTokenLimit?: number }) {
  const limit = opts?.dailyTokenLimit ?? 100_000;
  if (!orgBudgets.has(orgId)) {
    orgBudgets.set(orgId, { dailyTokenLimit: limit, usedToday: 0, hardLimit: true });
  }
  const budget = orgBudgets.get(orgId)!;

  const memory: MemoryLayer = {
    async getThread(org, user, thread) {
      return orgMemories.get(`${org}:${user}:${thread}`) ?? [];
    },
    async append(org, user, thread, message) {
      const key = `${org}:${user}:${thread}`;
      const arr = orgMemories.get(key) ?? [];
      arr.push(message);
      orgMemories.set(key, arr);
    },
    async clear(org, user, thread) {
      orgMemories.delete(`${org}:${user}:${thread}`);
    },
  };

  return {
    budget,
    memory,
    async complete(adapter: LlmAdapter, req: LlmRequest, ctx: TenantAiContext) {
      if (budget.usedToday + (req.maxTokens ?? 1000) > budget.dailyTokenLimit && budget.hardLimit) {
        throw new Error(`AI token budget exceeded for org ${orgId}`);
      }
      const isolatedReq: LlmRequest = {
        ...req,
        messages: [
          { role: "system", content: `ORG:${ctx.organizationId} — isolated tenant context` },
          ...req.messages,
        ],
      };
      const res = await adapter.complete(isolatedReq, ctx);
      budget.usedToday += res.tokensUsed;
      return res;
    },
  };
}

export type AiRuntime = ReturnType<typeof createAiRuntime>;
