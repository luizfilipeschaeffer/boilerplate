export type IntegratorCategory =
  | "payment"
  | "messaging"
  | "fiscal"
  | "storage"
  | "social"
  | "webhook";

export interface IntegratorField {
  key: string;
  label: string;
  type: "secret" | "string" | "url" | "boolean" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface IntegratorCapabilities {
  webhooks?: boolean;
  externalHttp?: boolean;
  storage?: boolean;
}

export type ResolvedCredentials = {
  secrets: Record<string, string>;
  configPublic: Record<string, unknown>;
  source: "tenant" | "platform" | "mock";
};

export type HealthStatus =
  | { ok: true; latencyMs?: number }
  | { ok: false; code: string; message: string };

export type PaymentAdapter = {
  createCharge(input: unknown): Promise<unknown>;
  refund?(input: unknown): Promise<unknown>;
};

export type MessagingAdapter = {
  send(input: { to: string; subject?: string; body: string }): Promise<{ id: string }>;
};

export type FiscalAdapter = {
  emit(input: unknown): Promise<unknown>;
};

export type StorageAdapter = {
  put(key: string, data: Buffer | Uint8Array): Promise<{ url: string }>;
  get(key: string): Promise<Buffer | null>;
};

export type SocialAdapter = {
  sendMessage(input: unknown): Promise<unknown>;
};

export type IntegratorAdapter =
  | PaymentAdapter
  | MessagingAdapter
  | FiscalAdapter
  | StorageAdapter
  | SocialAdapter;

export interface BoilerplateIntegrator<TAdapter extends IntegratorAdapter = IntegratorAdapter> {
  id: string;
  version: string;
  category: IntegratorCategory;
  configSchema: IntegratorField[];
  capabilities: IntegratorCapabilities;
  healthCheck: (credentials: ResolvedCredentials) => Promise<HealthStatus>;
  adapter: TAdapter;
}
