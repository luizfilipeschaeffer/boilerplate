import { Resend } from "resend";
import { loginUrlWithEmail, passwordResetEmailCopyUrl } from "@/lib/app-url";
import {
  buildMemberInviteEmailHtml,
  buildPasswordResetEmailHtml,
  buildSignupVerificationEmailHtml,
  buildWelcomePasswordEmailHtml,
} from "@/lib/email/templates";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada. Adicione em .env ou .env.development.",
    );
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ?? "Boilerplate <onboarding@resend.dev>"
  );
}

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    throw new Error(error.message ?? "Falha ao enviar e-mail.");
  }
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
  });
}

/** Primeira senha após cadastro ou onboarding. */
export async function sendWelcomePasswordEmail(input: {
  to: string;
  name: string;
  code: string;
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
  });
}

/** Código de recuperação de senha / acesso. */
export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  code: string;
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
  });
}
