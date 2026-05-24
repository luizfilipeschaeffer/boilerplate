"use server";

import {
  assertEmailVerifiedForSignup,
  createSignupEmailVerification,
  verifySignupEmailCode,
} from "@boilerplate/db";
import { checkSignupEmail } from "@/app/actions/signup";
import { sendSignupVerificationEmail } from "@/lib/email/resend";
import { canSendWithResend, isResendDevFallback } from "@/lib/email/resend-config";

export async function sendSignupVerificationCode(
  email: string,
  name: string,
): Promise<{ sent: boolean }> {
  const normalized = email.trim().toLowerCase();
  const check = await checkSignupEmail(normalized);
  if (!check.canRegister) {
    throw new Error(
      "Este e-mail já possui uma conta. Use Entrar para acessar o painel.",
    );
  }

  const { code } = await createSignupEmailVerification(normalized);

  if (isResendDevFallback() && !(await canSendWithResend())) {
    console.info(
      `[dev] Código de verificação para ${normalized}: ${code}`,
    );
    return { sent: true };
  }

  await sendSignupVerificationEmail({
    to: normalized,
    name: name.trim(),
    code,
  });

  return { sent: true };
}

export async function confirmSignupEmailCode(
  email: string,
  code: string,
): Promise<{ verified: boolean }> {
  const normalized = email.trim().toLowerCase();
  const ok = await verifySignupEmailCode(normalized, code);
  if (!ok) {
    return { verified: false };
  }
  return { verified: true };
}

export { assertEmailVerifiedForSignup };
