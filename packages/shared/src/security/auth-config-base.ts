export function buildSessionCookieOptions(sessionTokenName: string) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    sessionToken: {
      name: sessionTokenName,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProd,
      },
    },
  };
}

export function buildSessionConfig() {
  return {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  };
}

export function resolveTrustHost(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.AUTH_TRUSTED_HOSTS?.trim()) return true;
  return Boolean(process.env.AUTH_URL?.trim() || process.env.VERCEL_URL);
}
