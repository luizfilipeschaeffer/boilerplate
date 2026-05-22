"use server";

import {
  createPasswordResetVerification,
  findUserByEmailForAuth,
} from "@boilerplate/db";
import {
  loginUrlWithEmail,
  passwordResetEmailCopyUrl,
} from "@/lib/app-url";
import { sendMemberInviteEmail } from "@/lib/email/resend";
import { roleLabel } from "@/lib/role-labels";

export type MemberInviteEmailResult = {
  sent: boolean;
  needsPasswordSetup: boolean;
  loginUrl: string;
  setupUrl?: string;
  /** Apenas em dev sem Resend — código para testes manuais. */
  devCode?: string;
  message: string;
};

/**
 * Envia e-mail de convite com e-mail de login, papel, org e link para criar senha.
 */
export async function sendOrganizationMemberInviteEmail(input: {
  email: string;
  name?: string;
  role: string;
  organizationName: string;
}): Promise<MemberInviteEmailResult> {
  const normalized = input.email.trim().toLowerCase();
  const loginUrl = loginUrlWithEmail(normalized);
  const displayName =
    input.name?.trim() || normalized.split("@")[0] || "você";
  const role = roleLabel(input.role);

  const user = await findUserByEmailForAuth(normalized);
  const needsPasswordSetup = !user?.passwordHash;

  let setupCode: string | undefined;
  let setupUrl: string | undefined;

  if (needsPasswordSetup) {
    const created = await createPasswordResetVerification(normalized);
    if (created) {
      setupCode = created.code;
      setupUrl = passwordResetEmailCopyUrl(normalized, created.code);
    }
  }

  const hasResend = Boolean(process.env.RESEND_API_KEY);

  if (!hasResend && process.env.NODE_ENV === "development") {
    console.info(
      `[dev] Convite membro ${normalized} · org: ${input.organizationName} · papel: ${role}`,
    );
    console.info(`[dev] Login: ${loginUrl}`);
    if (setupUrl && setupCode) {
      console.info(`[dev] Criar senha: ${setupUrl}`);
      console.info(`[dev] Código: ${setupCode}`);
    }
    return {
      sent: true,
      needsPasswordSetup,
      loginUrl,
      setupUrl,
      devCode: setupCode,
      message: needsPasswordSetup
        ? "Convite registrado (dev). Código e links no terminal do servidor."
        : "Convite registrado (dev). Link de login no terminal do servidor.",
    };
  }

  if (!hasResend) {
    return {
      sent: false,
      needsPasswordSetup,
      loginUrl,
      setupUrl,
      message:
        "Membro criado, mas RESEND_API_KEY não está configurada para enviar o e-mail.",
    };
  }

  if (needsPasswordSetup && !setupCode) {
    return {
      sent: false,
      needsPasswordSetup: true,
      loginUrl,
      message:
        "Membro criado. Aguarde 1 minuto e reenvie o convite (limite de reenvio de código).",
    };
  }

  try {
    await sendMemberInviteEmail({
      to: normalized,
      name: displayName,
      organizationName: input.organizationName,
      roleLabel: role,
      needsPasswordSetup,
      setupCode,
    });
    return {
      sent: true,
      needsPasswordSetup,
      loginUrl,
      setupUrl,
      message: needsPasswordSetup
        ? "Convite enviado por e-mail com link para criar senha e acessar o painel."
        : "Convite enviado por e-mail com instruções de login.",
    };
  } catch (err) {
    return {
      sent: false,
      needsPasswordSetup,
      loginUrl,
      setupUrl,
      message:
        err instanceof Error
          ? `Membro criado, mas o e-mail falhou: ${err.message}`
          : "Membro criado, mas o e-mail não foi enviado.",
    };
  }
}
