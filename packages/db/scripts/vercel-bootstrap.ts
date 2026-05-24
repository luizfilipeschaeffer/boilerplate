#!/usr/bin/env bun
/**
 * Bootstrap idempotente do banco para deploy Vercel (preview/staging/demo).
 * Executado quando RUN_VERCEL_DB_BOOTSTRAP=true (recomendado só no projeto platform-admin).
 *
 * Passos:
 *  1. prisma db push (schema boilerplate)
 *  2. seed roadmap + catálogo de integradores/módulos/segmentos
 *  3. seed platform-admin (se ALLOW_PLATFORM_ADMIN_SEED=true)
 *  4. seed credenciais demo de integradores (se ALLOW_INTEGRATOR_CREDENTIALS_SEED=true)
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const DB_ROOT = join(SCRIPTS_DIR, "..");

function run(label: string, script: string): void {
  console.log(`\n[vercel-bootstrap] ${label}`);
  const result = spawnSync(process.execPath, [join(SCRIPTS_DIR, script)], {
    cwd: DB_ROOT,
    env: process.env,
    stdio: "inherit",
  });
  if ((result.status ?? 1) !== 0) {
    console.error(`[vercel-bootstrap] Falhou: ${label}`);
    process.exit(result.status ?? 1);
  }
}

function runPrisma(args: string[]): void {
  console.log(`\n[vercel-bootstrap] prisma ${args.join(" ")}`);
  const result = spawnSync(process.execPath, ["./scripts/prisma-env.ts", ...args], {
    cwd: DB_ROOT,
    env: process.env,
    stdio: "inherit",
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[vercel-bootstrap] DATABASE_URL ausente — abortando bootstrap.");
    process.exit(1);
  }

  console.log("[vercel-bootstrap] Iniciando bootstrap do banco…");
  console.log(`[vercel-bootstrap] VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}`);

  runPrisma(["generate"]);
  runPrisma(["db", "push", "--accept-data-loss"]);

  run("Catálogo, módulos, segmentos e integradores", "seed-product-roadmap.ts");

  if (process.env.ALLOW_PLATFORM_ADMIN_SEED === "true") {
    run("Operador platform-admin", "seed-platform-admin.ts");
  } else {
    console.log(
      "[vercel-bootstrap] Pulando seed platform-admin (ALLOW_PLATFORM_ADMIN_SEED≠true)",
    );
  }

  if (process.env.ALLOW_INTEGRATOR_CREDENTIALS_SEED === "true") {
    run("Credenciais demo de integradores", "seed-integrator-credentials.ts");
  } else {
    console.log(
      "[vercel-bootstrap] Pulando credenciais de integradores (ALLOW_INTEGRATOR_CREDENTIALS_SEED≠true)",
    );
  }

  console.log("\n[vercel-bootstrap] Concluído.");
}

await main();
