import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type MonorepoApp = "web" | "platform-admin";

/** Raiz do monorepo a partir do diretório de um app (ex.: apps/web). */
export function monorepoRootFromApp(appDirname: string): string {
  return path.join(appDirname, "../..");
}

function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Carrega .env da raiz do monorepo (ordem Next.js). Não sobrescreve env já definida. */
export function loadMonorepoEnv(appDirname: string): string {
  const root = monorepoRootFromApp(appDirname);
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const files = [
    ".env",
    ".env.local",
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];

  for (const name of files) {
    const filePath = path.join(root, name);
    if (!existsSync(filePath)) continue;
    const vars = parseDotEnv(readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(vars)) {
      if (!process.env[key]?.trim()) process.env[key] = value;
    }
  }

  return root;
}

/**
 * Mapeia variáveis por app definidas na raiz (AUTH_URL_WEB, AUTH_URL_ADMIN, …)
 * para as chaves que Auth.js / Next leem em runtime (AUTH_URL, DEV_ALLOWED_ORIGIN).
 * Não sobrescreve valores já injetados (Vercel, CI).
 */
export function applyMonorepoAppEnv(app: MonorepoApp): void {
  if (!process.env.AUTH_URL?.trim()) {
    const key = app === "web" ? "AUTH_URL_WEB" : "AUTH_URL_ADMIN";
    const value = process.env[key]?.trim();
    if (value) process.env.AUTH_URL = value;
  }

  const appOriginKey = app === "web" ? "DEV_ALLOWED_ORIGIN_WEB" : "DEV_ALLOWED_ORIGIN_ADMIN";
  const appOrigin = process.env[appOriginKey]?.trim();
  if (appOrigin) {
    process.env.DEV_ALLOWED_ORIGIN = appOrigin;
  }
}

/** Flags bun --env-file na ordem Next.js (raiz do monorepo). */
export const MONOREPO_ENV_FILE_FLAGS = [
  "--env-file=../../.env",
  "--env-file=../../.env.development",
  "--env-file=../../.env.local",
] as const;
