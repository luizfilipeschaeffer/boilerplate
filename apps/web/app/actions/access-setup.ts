"use server";

import {
  createPasswordResetVerification,
  findUserByEmailForAuth,
  isRegisteredAppUser,
} from "@boilerplate/db";
import { passwordResetEmailCopyUrl } from "@/lib/app-url";
import { sendWelcomePasswordEmail } from "@/lib/email/resend";

/**
 * Envia e-mail com código para criar a primeira senha (reutiliza fluxo de /esqueci-senha).
 */
export async function sendInitialPasswordSetupEmail(
  email: string,
  name?: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  if (!(await isRegisteredAppUser(normalized))) {
    return false;
  }

  const existing = await findUserByEmailForAuth(normalized);
  if (existing?.passwordHash) {
    return false;
  }

  const created = await createPasswordResetVerification(normalized);
  if (!created) {
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.RESEND_API_KEY
    ) {
      console.info(
        `[dev] Criação de senha: aguarde 1 minuto ou abra /esqueci-senha com ${normalized}.`,
      );
    }
    return false;
  }

  const displayName =
    name?.trim() ||
    existing?.name?.trim() ||
    normalized.split("@")[0] ||
    "você";

  if (
    process.env.NODE_ENV === "development" &&
    !process.env.RESEND_API_KEY
  ) {
    console.info(
      `[dev] Código para criar senha (${normalized}): ${created.code}`,
    );
    console.info(
      `[dev] Link: ${passwordResetEmailCopyUrl(normalized, created.code)}`,
    );
    return true;
  }

  await sendWelcomePasswordEmail({
    to: normalized,
    name: displayName,
    code: created.code,
  });
  return true;
}
