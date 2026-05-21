/**
 * Templates HTML para e-mails transacionais (compatível com clientes de e-mail).
 */

const THEME = {
  pageBg: "#f1f5f9",
  cardBg: "#ffffff",
  cardBorder: "#e2e8f0",
  primary: "#0f172a",
  primarySoft: "#1e293b",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
  text: "#334155",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  codeBg: "#f8fafc",
  codeBorder: "#e2e8f0",
  infoBg: "#eff6ff",
  infoBorder: "#bfdbfe",
  radius: "16px",
  radiusSm: "10px",
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function firstNameFrom(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "você";
}

type EmailLayoutInput = {
  preheader: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  footerLabel?: string;
};

export function buildEmailLayout(input: EmailLayoutInput): string {
  const eyebrow = input.eyebrow
    ? `<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${THEME.accent}">${escapeHtml(input.eyebrow)}</p>`
    : "";

  const footer = input.footerLabel ?? "Boilerplate";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${THEME.pageBg};font-family:${THEME.font};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(input.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${THEME.pageBg};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="background:linear-gradient(135deg,${THEME.primary} 0%,${THEME.primarySoft} 100%);border-radius:12px;padding:12px 20px;">
                    <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Boilerplate</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:${THEME.cardBg};border:1px solid ${THEME.cardBorder};border-radius:${THEME.radius};overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,${THEME.accent} 0%,#60a5fa 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 28px 28px;">
                    ${eyebrow}
                    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;line-height:1.3;color:${THEME.primary};letter-spacing:-0.02em;">${escapeHtml(input.title)}</h1>
                    <div style="font-size:15px;line-height:1.65;color:${THEME.text};">
                      ${input.bodyHtml}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${THEME.textMuted};">
                Este é um e-mail automático. Não responda a esta mensagem.
              </p>
              <p style="margin:0;font-size:12px;color:${THEME.textLight};">
                © ${new Date().getFullYear()} ${escapeHtml(footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type OtpBlockInput = {
  code: string;
  copyUrl?: string;
  copyHint?: string;
  validityMinutes?: number;
};

export function buildOtpBlock(input: OtpBlockInput): string {
  const code = escapeHtml(input.code);
  const minutes = input.validityMinutes ?? 15;
  const copyHint =
    input.copyHint ??
    "Selecione o código ou use o botão Copiar (abre o site e cola automaticamente).";

  const copyCell = input.copyUrl
    ? `<td style="vertical-align:middle;padding-left:12px;">
        <a href="${escapeHtml(input.copyUrl)}" target="_blank" style="display:inline-block;background-color:${THEME.primary};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 22px;border-radius:${THEME.radiusSm};white-space:nowrap;mso-padding-alt:0;">Copiar código</a>
      </td>`
    : "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background-color:${THEME.codeBg};border:1px solid ${THEME.codeBorder};border-radius:${THEME.radiusSm};padding:20px 28px;font-family:${THEME.mono};font-size:32px;font-weight:700;letter-spacing:8px;color:${THEME.primary};text-align:center;">
                ${code}
              </td>
              ${copyCell}
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:${THEME.textMuted};text-align:center;">
      ${escapeHtml(copyHint)}
    </p>
    <p style="margin:0;font-size:12px;color:${THEME.textLight};text-align:center;">
      Válido por ${minutes} minutos
    </p>`;
}

export function buildInfoBox(html: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="background-color:${THEME.infoBg};border:1px solid ${THEME.infoBorder};border-radius:${THEME.radiusSm};padding:14px 16px;font-size:14px;line-height:1.55;color:${THEME.text};">
          ${html}
        </td>
      </tr>
    </table>`;
}

export function buildParagraph(text: string): string {
  return `<p style="margin:0 0 16px;">${text}</p>`;
}

export function buildSignupVerificationEmailHtml(input: {
  name: string;
  code: string;
}): string {
  const name = escapeHtml(firstNameFrom(input.name));

  const body = [
    buildParagraph(`Olá, <strong>${name}</strong>!`),
    buildParagraph(
      "O <strong>Aprendiz</strong> está te conhecendo. Para confirmar seu e-mail e continuar o cadastro, use o código abaixo na conversa:",
    ),
    buildOtpBlock({
      code: input.code,
      copyHint:
        "Cole este código na conversa com o Aprendiz na página de cadastro.",
      validityMinutes: 15,
    }),
    buildInfoBox(
      "<strong>Não foi você?</strong> Pode ignorar este e-mail com segurança — nenhuma conta será criada sem o código.",
    ),
  ].join("");

  return buildEmailLayout({
    preheader: `Seu código de confirmação: ${input.code}`,
    eyebrow: "Aprendiz · Cadastro",
    title: "Confirme seu e-mail",
    footerLabel: "Aprendiz · Boilerplate",
    bodyHtml: body,
  });
}

export function buildWelcomePasswordEmailHtml(input: {
  name: string;
  code: string;
  copyUrl: string;
}): string {
  const name = escapeHtml(firstNameFrom(input.name));

  const body = [
    buildParagraph(`Olá, <strong>${name}</strong>!`),
    buildParagraph(
      "Sua conta no painel já está pronta. Para acessar de novo depois deste primeiro contato, <strong>crie sua senha</strong> com o código abaixo:",
    ),
    buildOtpBlock({
      code: input.code,
      copyUrl: input.copyUrl,
      copyHint:
        "Abra o link, cole o código e defina uma senha com pelo menos 8 caracteres.",
      validityMinutes: 15,
    }),
    buildInfoBox(
      "<strong>Próximos acessos:</strong> use seu e-mail e a senha que você criar. Se o painel já está aberto neste aparelho, você pode continuar explorando e criar a senha quando quiser.",
    ),
  ].join("");

  return buildEmailLayout({
    preheader: `Crie sua senha de acesso — código ${input.code}`,
    eyebrow: "Aprendiz · Primeiro acesso",
    title: "Crie sua senha de acesso",
    footerLabel: "Aprendiz · Boilerplate",
    bodyHtml: body,
  });
}

export function buildPasswordResetEmailHtml(input: {
  name: string;
  code: string;
  copyUrl: string;
}): string {
  const name = escapeHtml(firstNameFrom(input.name));

  const body = [
    buildParagraph(`Olá, <strong>${name}</strong>!`),
    buildParagraph(
      "Recebemos um pedido para <strong>redefinir o acesso</strong> à sua conta. Use o código abaixo na página de recuperação:",
    ),
    buildOtpBlock({
      code: input.code,
      copyUrl: input.copyUrl,
      validityMinutes: 15,
    }),
    buildInfoBox(
      "<strong>Não solicitou esta alteração?</strong> Ignore este e-mail — sua senha atual continua válida.",
    ),
  ].join("");

  return buildEmailLayout({
    preheader: `Código para redefinir acesso: ${input.code}`,
    eyebrow: "Segurança",
    title: "Redefinir acesso",
    bodyHtml: body,
  });
}
