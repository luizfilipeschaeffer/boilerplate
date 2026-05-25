#!/usr/bin/env bun
/**
 * Setup completo do banco remoto (Neon) — local ou CI manual.
 * Uso: bun run db:setup-remote (carrega .env.vercel.production na raiz)
 *
 * Passos:
 *  1. vercel-schema-sync (generate + db push)
 *  2. seed roadmap (catálogo, módulos, segmentos, integradores)
 *  3. seed platform-admin (se ALLOW_PLATFORM_ADMIN_SEED=true)
 *  4. seed credenciais demo (se ALLOW_INTEGRATOR_CREDENTIALS_SEED=true)
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const DB_ROOT = join(SCRIPTS_DIR, "..");

function run(label: string, script: string): void {
  console.log(`\n[setup-remote] ${label}`);
  const result = spawnSync(process.execPath, [join(SCRIPTS_DIR, script)], {
    cwd: DB_ROOT,
    env: process.env,
    stdio: "inherit",
  });
  if ((result.status ?? 1) !== 0) {
    console.error(`[setup-remote] Falhou: ${label}`);
    process.exit(result.status ?? 1);
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[setup-remote] DATABASE_URL ausente — configure .env.vercel.production.");
    process.exit(1);
  }

  console.log("[setup-remote] Iniciando setup remoto (schema + seeds)…");

  run("Sincronização de schema", "vercel-schema-sync.ts");
  run("Catálogo, módulos, segmentos e integradores", "seed-product-roadmap.ts");

  if (process.env.ALLOW_PLATFORM_ADMIN_SEED === "true") {
    run("Operador platform-admin", "seed-platform-admin.ts");
  } else {
    console.log(
      "[setup-remote] Pulando seed platform-admin (ALLOW_PLATFORM_ADMIN_SEED≠true)",
    );
  }

  if (process.env.ALLOW_INTEGRATOR_CREDENTIALS_SEED === "true") {
    run("Credenciais demo de integradores", "seed-integrator-credentials.ts");
  } else {
    console.log(
      "[setup-remote] Pulando credenciais de integradores (ALLOW_INTEGRATOR_CREDENTIALS_SEED≠true)",
    );
  }

  console.log("\n[setup-remote] Concluído.");
}

await main();
