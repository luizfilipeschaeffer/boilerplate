export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}

export function sellerInviteUrl(token: string): string {
  const params = new URLSearchParams({ token });
  return `${getAppUrl()}/convite-vendedor?${params.toString()}`;
}

export function passwordResetEmailCopyUrl(email: string, code: string): string {
  const params = new URLSearchParams({
    email,
    code,
    copiar: "1",
  });
  return `${getAppUrl()}/esqueci-senha?${params.toString()}`;
}

/** Link direto para login com e-mail pré-preenchido. */
export function loginUrlWithEmail(email: string): string {
  const params = new URLSearchParams({ email: email.trim().toLowerCase() });
  return `${getAppUrl()}/login?${params.toString()}`;
}
