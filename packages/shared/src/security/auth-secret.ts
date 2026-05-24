const DEV_FALLBACK = "dev-only-auth-secret-change-in-env";

/** Resolve secret por app; fallback legado AUTH_SECRET; dev-only hardcoded. */
export function resolveAuthSecret(appEnvKey: "AUTH_SECRET_WEB" | "AUTH_SECRET_PLATFORM_ADMIN"): string | undefined {
  const appSpecific = process.env[appEnvKey]?.trim();
  if (appSpecific) return appSpecific;

  const shared = process.env.AUTH_SECRET?.trim();
  if (shared) return shared;

  if (process.env.NODE_ENV === "development") return DEV_FALLBACK;

  return undefined;
}

export function requireAuthSecret(appEnvKey: "AUTH_SECRET_WEB" | "AUTH_SECRET_PLATFORM_ADMIN"): string {
  const secret = resolveAuthSecret(appEnvKey);
  if (!secret) {
    throw new Error(
      `${appEnvKey} ou AUTH_SECRET é obrigatório fora de development.`,
    );
  }
  return secret;
}
