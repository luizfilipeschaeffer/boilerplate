/** ID do integrador Resend em produção (catálogo platform-catalog.json). */
export const MESSAGING_RESEND_INTEGRATOR_ID = "messaging-resend";

const MOCK_INTEGRATOR_PATTERN = /-(mock|noop)$/;

export function isMockIntegrator(integratorId: string): boolean {
  if (integratorId === "fiscal-noop" || integratorId === "payment-mock") {
    return true;
  }
  return MOCK_INTEGRATOR_PATTERN.test(integratorId);
}

export type CredentialSource = "tenant" | "platform" | "mock" | "none";

export type ResolvedCredentials = {
  secrets: Record<string, string>;
  configPublic: Record<string, unknown>;
  source: Exclude<CredentialSource, "none">;
};

export type CredentialStatus = {
  configured: boolean;
  source: CredentialSource;
  maskedSecrets: Record<string, string>;
  configPublic: Record<string, unknown>;
};

export class IntegratorCredentialNotConfiguredError extends Error {
  readonly integratorId: string;
  readonly organizationId?: string | null;

  constructor(integratorId: string, organizationId?: string | null) {
    super(`Credenciais não configuradas para integrador ${integratorId}.`);
    this.name = "IntegratorCredentialNotConfiguredError";
    this.integratorId = integratorId;
    this.organizationId = organizationId;
  }
}
