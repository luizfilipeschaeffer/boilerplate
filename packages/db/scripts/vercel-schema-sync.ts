#!/usr/bin/env bun
/**
 * Sincronização de schema para deploy Vercel (preview/staging).
 * Executado quando RUN_VERCEL_DB_BOOTSTRAP=true — sem seeds.
 *
 * Passos: prisma generate + prisma db push
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const DB_ROOT = join(SCRIPTS_DIR, "..");

function runPrisma(args: string[]): void {
  console.log(`\n[vercel-schema-sync] prisma ${args.join(" ")}`);
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
    console.error("[vercel-schema-sync] DATABASE_URL ausente — abortando.");
    process.exit(1);
  }

  console.log("[vercel-schema-sync] Iniciando sincronização de schema…");
  console.log(`[vercel-schema-sync] VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}`);

  runPrisma(["generate"]);
  runPrisma(["db", "push", "--accept-data-loss"]);

  console.log("\n[vercel-schema-sync] Concluído.");
}

await main();
