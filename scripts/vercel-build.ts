#!/usr/bin/env bun
/**
 * Build usado pela Vercel em monorepo Turborepo.
 *
 * Uso (Build Command no painel Vercel):
 *   bun scripts/vercel-build.ts --filter @boilerplate/web
 *   bun scripts/vercel-build.ts --filter @boilerplate/platform-admin
 *
 * Schema sync no deploy (opcional, sem seeds):
 *   RUN_VERCEL_DB_BOOTSTRAP=true  → roda packages/db/scripts/vercel-schema-sync.ts antes do build
 *   Seeds: apenas local via `bun run db:setup-remote`. Recomendado: schema sync só em um projeto Vercel.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const filterIdx = args.indexOf("--filter");
const filter = filterIdx >= 0 ? args[filterIdx + 1] : undefined;

if (!filter) {
  console.error(
    "Uso: bun scripts/vercel-build.ts --filter @boilerplate/web|@boilerplate/platform-admin",
  );
  process.exit(1);
}

function run(label: string, cmd: string[], cwd = ROOT): void {
  console.log(`\n[vercel-build] ${label}`);
  const result = spawnSync(cmd[0]!, cmd.slice(1), {
    cwd,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if ((result.status ?? 1) !== 0) {
    console.error(`[vercel-build] Falhou: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`[vercel-build] App: ${filter}`);
console.log(`[vercel-build] VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}`);

const vercelEnv = process.env.VERCEL_ENV;
if (process.env.VERCEL === "1" && vercelEnv && vercelEnv !== "development") {
  run("Validar variáveis de ambiente", [
    process.execPath,
    "scripts/validate-env.ts",
    "--strict",
  ]);
}

if (process.env.RUN_VERCEL_DB_BOOTSTRAP === "true") {
  run("Schema sync do banco", [
    process.execPath,
    "packages/db/scripts/vercel-schema-sync.ts",
  ]);
} else {
  console.log(
    "[vercel-build] Schema sync desabilitado (RUN_VERCEL_DB_BOOTSTRAP≠true)",
  );
}

run(`turbo run build (${filter})`, [
  "bunx",
  "turbo",
  "run",
  "build",
  "--filter",
  filter,
]);

console.log("\n[vercel-build] OK");
