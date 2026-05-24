const KEK_ENV = "INTEGRATOR_ENCRYPTION_KEY";

export class IntegratorKekError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegratorKekError";
  }
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isStagingEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function getIntegratorKek(): Buffer {
  const raw = process.env[KEK_ENV]?.trim();
  if (!raw) {
    throw new IntegratorKekError(
      "INTEGRATOR_ENCRYPTION_KEY não configurada.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new IntegratorKekError(
      "INTEGRATOR_ENCRYPTION_KEY deve ser 32 bytes em base64 (openssl rand -base64 32).",
    );
  }
  return key;
}

/** Fail fast em produção/staging se a KEK estiver ausente ou inválida. */
export function assertKekConfigured(): void {
  if (!isProductionEnvironment() && !isStagingEnvironment()) return;
  getIntegratorKek();
}
