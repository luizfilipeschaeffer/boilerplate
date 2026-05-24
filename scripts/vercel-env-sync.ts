#!/usr/bin/env bun
/**
 * Sincroniza .env.vercel.production → projetos Vercel (web + platform-admin).
 *
 * Uso:
 *   copy doc\vercel\env.production.example .env.vercel.production
 *   bun run vercel:env-sync
 *   bun run vercel:env-sync -- --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(ROOT, "apps/web");
const ADMIN = join(ROOT, "apps/platform-admin");
const ENV_FILE = join(ROOT, ".env.vercel.production");

const ENVS = ["preview", "production"] as const;
const dryRun = process.argv.includes("--dry-run");

function parseDotEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

function run(cwd: string, args: string[]): number {
  if (dryRun) {
    console.log(`[dry-run] (${cwd}) vercel ${args.join(" ")}`);
    return 0;
  }
  const result = spawnSync("bunx", ["vercel", ...args], {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

function upsert(
  cwd: string,
  key: string,
  value: string,
  environments: readonly string[],
  previewBranch: string,
): void {
  for (const env of environments) {
    run(cwd, ["env", "rm", key, env, "--yes"]);
    run(cwd, ["env", "rm", key, env, previewBranch, "--yes"]);
    const addArgs =
      env === "preview"
        ? ["env", "add", key, env, previewBranch, "--value", value, "--yes"]
        : ["env", "add", key, env, "--value", value, "--yes"];
    const code = run(cwd, addArgs);
    if (code !== 0) {
      console.error(`[vercel-env-sync] Falhou: ${key} (${env})`);
      process.exit(code);
    }
    console.log(`[vercel-env-sync] OK ${key} → ${env}`);
  }
}

function requireKey(env: Record<string, string>, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    console.error(`[vercel-env-sync] ${key} obrigatório em .env.vercel.production`);
    process.exit(1);
  }
  return value;
}

function pick(env: Record<string, string>, key: string): string | undefined {
  const value = env[key]?.trim();
  return value || undefined;
}

function syncProject(
  cwd: string,
  label: string,
  vars: Record<string, string | undefined>,
  previewBranch: string,
): void {
  const entries = Object.entries(vars).filter(([, v]) => Boolean(v?.trim()));
  if (entries.length === 0) return;
  console.log(`\n[vercel-env-sync] ${label} (${entries.length} vars)`);
  for (const [key, value] of entries) {
    upsert(cwd, key, value!.trim(), ENVS, previewBranch);
  }
}

if (!existsSync(ENV_FILE)) {
  console.error(
    "[vercel-env-sync] Arquivo .env.vercel.production não encontrado.\n" +
      "  copy doc\\vercel\\env.production.example .env.vercel.production",
  );
  process.exit(1);
}

const env = parseDotEnv(ENV_FILE);
const previewBranch = pick(env, "VERCEL_PREVIEW_BRANCH") ?? "main";

const webUrl = pick(env, "VERCEL_WEB_URL") ?? pick(env, "NEXT_PUBLIC_APP_URL");
const adminUrl =
  pick(env, "VERCEL_ADMIN_URL") ?? pick(env, "NEXT_PUBLIC_PLATFORM_ADMIN_URL");

if (!webUrl || !adminUrl) {
  console.error(
    "[vercel-env-sync] Defina VERCEL_WEB_URL e VERCEL_ADMIN_URL (ou NEXT_PUBLIC_*).",
  );
  process.exit(1);
}

requireKey(env, "DATABASE_URL");
requireKey(env, "INTEGRATOR_ENCRYPTION_KEY");

const authWeb = pick(env, "AUTH_SECRET_WEB") ?? pick(env, "AUTH_SECRET");
const authAdmin = pick(env, "AUTH_SECRET_PLATFORM_ADMIN") ?? pick(env, "AUTH_SECRET");

if (!authWeb) {
  console.error("[vercel-env-sync] AUTH_SECRET_WEB (ou AUTH_SECRET) obrigatório.");
  process.exit(1);
}
if (!authAdmin) {
  console.error(
    "[vercel-env-sync] AUTH_SECRET_PLATFORM_ADMIN (ou AUTH_SECRET) obrigatório.",
  );
  process.exit(1);
}

const nextPublicApp = pick(env, "NEXT_PUBLIC_APP_URL") ?? webUrl;
const nextPublicAdmin = pick(env, "NEXT_PUBLIC_PLATFORM_ADMIN_URL") ?? adminUrl;

console.log("[vercel-env-sync] Preview branch:", previewBranch);
console.log("[vercel-env-sync] URLs:", { web: webUrl, admin: adminUrl });
if (dryRun) console.log("[vercel-env-sync] Modo dry-run — nada será enviado à Vercel.\n");

const sharedKeys = [
  "DATABASE_URL",
  "INTEGRATOR_ENCRYPTION_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const;

const shared: Record<string, string | undefined> = {
  NEXT_PUBLIC_APP_URL: nextPublicApp,
  NEXT_PUBLIC_PLATFORM_ADMIN_URL: nextPublicAdmin,
};
for (const key of sharedKeys) {
  shared[key] = pick(env, key);
}

const webVars: Record<string, string | undefined> = {
  ...shared,
  AUTH_SECRET_WEB: authWeb,
  AUTH_URL: pick(env, "AUTH_URL_WEB") ?? pick(env, "AUTH_URL") ?? webUrl,
  PAYMENT_WEBHOOK_SECRET: pick(env, "PAYMENT_WEBHOOK_SECRET"),
};

const adminVars: Record<string, string | undefined> = {
  ...shared,
  AUTH_SECRET_PLATFORM_ADMIN: authAdmin,
  AUTH_URL: pick(env, "AUTH_URL_ADMIN") ?? pick(env, "AUTH_URL") ?? adminUrl,
  RUN_VERCEL_DB_BOOTSTRAP: pick(env, "RUN_VERCEL_DB_BOOTSTRAP") ?? "true",
  ALLOW_PLATFORM_ADMIN_SEED: pick(env, "ALLOW_PLATFORM_ADMIN_SEED") ?? "true",
  ALLOW_INTEGRATOR_CREDENTIALS_SEED:
    pick(env, "ALLOW_INTEGRATOR_CREDENTIALS_SEED") ?? "true",
  PLATFORM_ADMIN_SEED_EMAIL: pick(env, "PLATFORM_ADMIN_SEED_EMAIL"),
  PLATFORM_ADMIN_SEED_PASSWORD: pick(env, "PLATFORM_ADMIN_SEED_PASSWORD"),
  PLATFORM_ADMIN_SEED_NAME: pick(env, "PLATFORM_ADMIN_SEED_NAME") ?? "Super Admin",
};

syncProject(WEB, "boilerplate-web", webVars, previewBranch);
syncProject(ADMIN, "boilerplate-platform-admin", adminVars, previewBranch);

console.log("\n[vercel-env-sync] Concluído.");
console.log("[vercel-env-sync] Próximo: cd apps/platform-admin && bunx vercel deploy");
