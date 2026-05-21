export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}

export function passwordResetEmailCopyUrl(email: string, code: string): string {
  const params = new URLSearchParams({
    email,
    code,
    copiar: "1",
  });
  return `${getAppUrl()}/esqueci-senha?${params.toString()}`;
}
