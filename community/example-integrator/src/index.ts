import type { BoilerplateIntegrator, MessagingAdapter } from "@boilerplate/sdk-core";

const mockAdapter: MessagingAdapter = {
  async send({ to, subject, body }) {
    return { id: `mock-${Date.now()}-${to}-${subject?.length ?? 0}-${body.length}` };
  },
};

export const exampleIntegrator: BoilerplateIntegrator<MessagingAdapter> = {
  id: "example-messaging",
  version: "0.1.0",
  category: "messaging",
  configSchema: [
    { key: "apiKey", label: "API Key", type: "secret", required: true },
    { key: "fromEmail", label: "From Email", type: "string", required: true },
  ],
  capabilities: { externalHttp: true },
  healthCheck: async (creds) => {
    if (!creds.secrets.apiKey) {
      return { ok: false, code: "MISSING_KEY", message: "apiKey required" };
    }
    return { ok: true, latencyMs: 12 };
  },
  adapter: mockAdapter,
};

export { mockAdapter };
