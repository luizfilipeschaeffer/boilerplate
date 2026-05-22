#!/usr/bin/env bun
/**
 * Simula o que a Vercel executa antes do deploy:
 * install → turbo build (com Prisma generate via @boilerplate/db#build).
 *
 * Uso:
 *   bun run check:vercel              # web + platform-admin
 *   bun run check:vercel -- --web     # só apps/web
 *   bun run check:vercel -- --admin   # só platform-admin
 *   bun run check:vercel -- --fresh   # apaga packages/db/src/generated (clone limpo)
 *   bun run check:vercel -- --skip-install
 */
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED_PRISMA = join(ROOT, "packages/db/src/generated");
const NEXT_DIRS = [
  join(ROOT, "apps/web/.next"),
  join(ROOT, "apps/platform-admin/.next"),
];

const args = new Set(process.argv.slice(2));
const onlyWeb = args.has("--web");
const onlyAdmin = args.has("--admin");
const fresh = args.has("--fresh");
const skipInstall = args.has("--skip-install");

const filters: string[] = [];
if (onlyWeb && !onlyAdmin) filters.push("@boilerplate/web");
else if (onlyAdmin && !onlyWeb) filters.push("@boilerplate/platform-admin");
else {
  filters.push("@boilerplate/web", "@boilerplate/platform-admin");
}

/** Mesmo padrão do generate-client — só para o build passar sem .env na raiz. */
const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL?.trim() ||
    "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=boilerplate",
  AUTH_SECRET:
    process.env.AUTH_SECRET?.trim() || "local-predeploy-check-secret-not-for-production",
};

function run(label: string, cmd: string[], cwd = ROOT): void {
  console.log(`\n[pre-deploy] ${label}`);
  const result = spawnSync(cmd[0]!, cmd.slice(1), {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if ((result.status ?? 1) !== 0) {
    console.error(`\n[pre-deploy] Falhou: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("[pre-deploy] Checagem estilo Vercel (install + turbo build)");
console.log(`[pre-deploy] Apps: ${filters.join(", ")}`);
if (!process.env.DATABASE_URL) {
  console.log("[pre-deploy] DATABASE_URL ausente — usando placeholder (só generate/build)");
}

async function main() {
  if (fresh) {
    if (existsSync(GENERATED_PRISMA)) {
      console.log("[pre-deploy] --fresh: removendo packages/db/src/generated");
      await rm(GENERATED_PRISMA, { recursive: true, force: true });
    }
    for (const dir of NEXT_DIRS) {
      if (existsSync(dir)) {
        console.log(`[pre-deploy] --fresh: removendo ${relative(ROOT, dir)}`);
        await rm(dir, { recursive: true, force: true });
      }
    }
  }

  if (!skipInstall) {
    run("bun install --frozen-lockfile", ["bun", "install", "--frozen-lockfile"]);
  }

  const turboArgs = ["bunx", "turbo", "run", "build", "--force", ...filters.flatMap((f) => ["--filter", f])];
  run(`turbo run build (${filters.join(", ")})`, turboArgs);

  console.log("\n[pre-deploy] OK — mesmo pipeline de build da Vercel passou localmente.");
  console.log("[pre-deploy] Para lint + validate + Postgres: bun run ci");
}

await main();
