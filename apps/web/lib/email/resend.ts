import {
  MESSAGING_RESEND_INTEGRATOR_ID,
  resolve,
} from "@boilerplate/db";
import { Resend } from "resend";
import { loginUrlWithEmail, passwordResetEmailCopyUrl } from "@/lib/app-url";
import {
  buildMemberInviteEmailHtml,
  buildPasswordResetEmailHtml,
  buildLoginVerificationEmailHtml,
  buildSignupVerificationEmailHtml,
  buildWelcomePasswordEmailHtml,
} from "@/lib/email/templates";

async function getResendClient(organizationId?: string | null): Promise<Resend> {
  const creds = await resolve(MESSAGING_RESEND_INTEGRATOR_ID, organizationId);
  const apiKey = creds.secrets.apiKey?.trim();
  if (!apiKey) {
    throw new Error("Credenciais do Resend não configuradas.");
  }
  return new Resend(apiKey);
}

async function getFromAddress(organizationId?: string | null): Promise<string> {
  try {
    const creds = await resolve(MESSAGING_RESEND_INTEGRATOR_ID, organizationId);
    const from = creds.configPublic.fromEmail;
    if (typeof from === "string" && from.trim()) {
      return from.trim();
    }
  } catch {
    // fallback abaixo
  }
  return (
    process.env.RESEND_FROM_EMAIL ?? "Boilerplate <onboarding@resend.dev>"
  );
}

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  organizationId?: string | null;
}): Promise<void> {
  const resend = await getResendClient(input.organizationId);
  const { error } = await resend.emails.send({
    from: await getFromAddress(input.organizationId),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    throw new Error(error.message ?? "Falha ao enviar e-mail.");
  }
}

/** Código para entrar no painel sem senha. */
export async function sendLoginVerificationEmail(input: {
  to: string;
  name: string;
  code: string;
  organizationId?: string | null;
}): Promise<void> {
  await sendHtmlEmail({
    to: input.to,
    subject: `${input.code} — seu código de acesso`,
    html: buildLoginVerificationEmailHtml({
      name: input.name,
      code: input.code,
    }),
    organizationId: input.organizationId,
  });
}

/** Código de verificação no cadastro com o Aprendiz. */
export async function sendSignupVerificationEmail(input: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  await sendHtmlEmail({
    to: input.to,
    subject: `${input.code} — confirme seu e-mail`,
    html: buildSignupVerificationEmailHtml({
      name: input.name,
      code: input.code,
    }),
  });
}

/** Convite de membro à organização (login + criar senha quando necessário). */
export async function sendMemberInviteEmail(input: {
  to: string;
  name: string;
  organizationName: string;
  roleLabel: string;
  needsPasswordSetup: boolean;
  setupCode?: string;
  organizationId?: string | null;
}): Promise<void> {
  const loginUrl = loginUrlWithEmail(input.to);
  const setupUrl =
    input.needsPasswordSetup && input.setupCode
      ? passwordResetEmailCopyUrl(input.to, input.setupCode)
      : undefined;

  await sendHtmlEmail({
    to: input.to,
    subject: input.needsPasswordSetup
      ? `Convite — ${input.organizationName}: crie sua senha de acesso`
      : `Convite — você foi adicionado em ${input.organizationName}`,
    html: buildMemberInviteEmailHtml({
      name: input.name,
      email: input.to,
      organizationName: input.organizationName,
      roleLabel: input.roleLabel,
      loginUrl,
      needsPasswordSetup: input.needsPasswordSetup,
      setupUrl,
      code: input.setupCode,
    }),
    organizationId: input.organizationId,
  });
}

/** Primeira senha após cadastro ou onboarding. */
export async function sendWelcomePasswordEmail(input: {
  to: string;
  name: string;
  code: string;
  organizationId?: string | null;
}): Promise<void> {
  const copyUrl = passwordResetEmailCopyUrl(input.to, input.code);

  await sendHtmlEmail({
    to: input.to,
    subject: `${input.code} — crie sua senha de acesso`,
    html: buildWelcomePasswordEmailHtml({
      name: input.name,
      code: input.code,
      copyUrl,
    }),
    organizationId: input.organizationId,
  });
}

/** Código de recuperação de senha / acesso. */
export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  code: string;
  organizationId?: string | null;
}): Promise<void> {
  const copyUrl = passwordResetEmailCopyUrl(input.to, input.code);

  await sendHtmlEmail({
    to: input.to,
    subject: `${input.code} — redefinir acesso`,
    html: buildPasswordResetEmailHtml({
      name: input.name,
      code: input.code,
      copyUrl,
    }),
    organizationId: input.organizationId,
  });
}
