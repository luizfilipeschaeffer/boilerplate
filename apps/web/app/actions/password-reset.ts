"use server";

import {
  assertPasswordResetVerified,
  createPasswordResetVerification,
  isRegisteredAppUser,
  prisma,
  setUserPassword,
  verifyPasswordResetCode,
} from "@boilerplate/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";

const GENERIC_SENT_MESSAGE =
  "Se existir uma conta com este e-mail, enviamos um código de recuperação. Confira sua caixa de entrada e o spam.";

const GENERIC_CODE_ERROR =
  "Código inválido ou expirado. Tente novamente ou solicite um novo código.";

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  const normalized = email.trim().toLowerCase();

  const registered = await isRegisteredAppUser(normalized);
  if (registered) {
    const created = await createPasswordResetVerification(normalized);
    if (created) {
      const user = await prisma.user.findUnique({
        where: { email: normalized },
        select: { name: true },
      });

      if (
        process.env.NODE_ENV === "development" &&
        !process.env.RESEND_API_KEY
      ) {
        console.info(
          `[dev] Código de recuperação para ${normalized}: ${created.code}`,
        );
      } else {
        await sendPasswordResetEmail({
          to: normalized,
          name: user?.name ?? "",
          code: created.code,
        });
      }
    }
  }

  return { message: GENERIC_SENT_MESSAGE };
}

export async function confirmPasswordResetCode(
  email: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();

  try {
    const valid = await verifyPasswordResetCode(normalized, code);
    if (!valid) {
      return { ok: false, error: GENERIC_CODE_ERROR };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : GENERIC_CODE_ERROR,
    };
  }
}

export async function completePasswordReset(
  email: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();

  if (newPassword.length < 8) {
    return { ok: false, error: "Use pelo menos 8 caracteres na nova senha." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "As senhas não coincidem." };
  }

  if (!(await isRegisteredAppUser(normalized))) {
    return { ok: false, error: GENERIC_CODE_ERROR };
  }

  try {
    await assertPasswordResetVerified(normalized);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : GENERIC_CODE_ERROR,
    };
  }

  await setUserPassword(normalized, newPassword);
  return { ok: true };
}
