"use server";

import {
  createLoginEmailVerification,
  isRegisteredAppUser,
  prisma,
  verifyLoginEmailCode,
} from "@boilerplate/db";
import { LOGIN_CODE_GENERIC_SENT } from "@/lib/auth/login-with-code";
import { sendLoginVerificationEmail } from "@/lib/email/resend";

export async function sendLoginVerificationCode(
  email: string,
): Promise<{ message: string }> {
  const normalized = email.trim().toLowerCase();

  const registered = await isRegisteredAppUser(normalized);
  if (registered) {
    const created = await createLoginEmailVerification(normalized);
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
          `[dev] Código de login para ${normalized}: ${created.code}`,
        );
      } else {
        await sendLoginVerificationEmail({
          to: normalized,
          name: user?.name ?? "",
          code: created.code,
        });
      }
    }
  }

  return { message: LOGIN_CODE_GENERIC_SENT };
}

export async function confirmLoginEmailCode(
  email: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();

  if (!(await isRegisteredAppUser(normalized))) {
    return { ok: false, error: LOGIN_CODE_INVALID };
  }

  try {
    const valid = await verifyLoginEmailCode(normalized, code);
    if (!valid) {
      return { ok: false, error: LOGIN_CODE_INVALID };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : LOGIN_CODE_INVALID,
    };
  }
}
