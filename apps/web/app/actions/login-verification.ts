"use server";

import {
  createLoginEmailVerification,
  isRegisteredAppUser,
  prisma,
  verifyLoginEmailCode,
} from "@boilerplate/db";
import {
  LOGIN_CODE_GENERIC_SENT,
  LOGIN_CODE_INVALID,
} from "@/lib/auth/login-with-code";
import { sendLoginVerificationEmail } from "@/lib/email/resend";
import { canSendWithResend, isResendDevFallback } from "@/lib/email/resend-config";
import {
  assertRateLimit,
  authRateLimit,
  auditLog,
  rateLimitKey,
  validatedAction,
  toClientError,
} from "@boilerplate/shared/security";
import { z } from "zod";
import { assertSameOriginAction, getClientIpFromHeaders } from "@/lib/action-security";
import { headers } from "next/headers";

const emailSchema = z.object({
  email: z.string().email().max(320),
});

const confirmSchema = z.object({
  email: z.string().email().max(320),
  code: z.string().min(4).max(12),
});

export async function sendLoginVerificationCode(
  email: string,
): Promise<{ message: string }> {
  return validatedAction(emailSchema, { email }, async ({ email: rawEmail }) => {
    await assertSameOriginAction();
    const h = await headers();
    const ip = getClientIpFromHeaders(h);
    const normalized = rawEmail.trim().toLowerCase();
    await assertRateLimit(authRateLimit, rateLimitKey(ip, `login-send:${normalized}`));

    const registered = await isRegisteredAppUser(normalized);
    if (registered) {
      const created = await createLoginEmailVerification(normalized);
      if (created) {
        const user = await prisma.user.findUnique({
          where: { email: normalized },
          select: { id: true, name: true },
        });

        if (
          process.env.NODE_ENV === "development" &&
          isResendDevFallback() &&
          !(await canSendWithResend())
        ) {
          console.info(`[dev] Código de login enviado para ${normalized}`);
        } else {
          await sendLoginVerificationEmail({
            to: normalized,
            name: user?.name ?? "",
            code: created.code,
          });
        }

        if (user?.id) {
          auditLog({
            action: "auth.login_code",
            actorId: user.id,
            metadata: { channel: "email" },
          });
        }
      }
    }

    return { message: LOGIN_CODE_GENERIC_SENT };
  }) as Promise<{ message: string }>;
}

export async function confirmLoginEmailCode(
  email: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  return validatedAction(confirmSchema, { email, code }, async ({ email: rawEmail, code: rawCode }) => {
    await assertSameOriginAction();
    const h = await headers();
    const ip = getClientIpFromHeaders(h);
    const normalized = rawEmail.trim().toLowerCase();
    await assertRateLimit(authRateLimit, rateLimitKey(ip, `login-confirm:${normalized}`));

    if (!(await isRegisteredAppUser(normalized))) {
      return { ok: false, error: LOGIN_CODE_INVALID };
    }

    try {
      const valid = await verifyLoginEmailCode(normalized, rawCode);
      if (!valid) {
        return { ok: false, error: LOGIN_CODE_INVALID };
      }
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: toClientError(e),
      };
    }
  }) as Promise<{ ok: boolean; error?: string }>;
}
