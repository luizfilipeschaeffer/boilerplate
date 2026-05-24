import {
  isIntegratorConfigured,
  MESSAGING_RESEND_INTEGRATOR_ID,
} from "@boilerplate/db";

/** Verifica se o Resend está configurado via credenciais criptografadas. */
export async function canSendWithResend(
  organizationId?: string | null,
): Promise<boolean> {
  try {
    return await isIntegratorConfigured(
      MESSAGING_RESEND_INTEGRATOR_ID,
      organizationId,
    );
  } catch {
    return false;
  }
}

export function isResendDevFallback(): boolean {
  return process.env.NODE_ENV === "development";
}
