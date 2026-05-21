#!/usr/bin/env bun
/**
 * Executa o Prisma CLI com DATABASE_URL da raiz do monorepo.
 * Ordem: .env → .env.development → .env.local
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DB = dirname(fileURLToPath(import.meta.url));
const DB_ROOT = join(PKG_DB, "..");
const MONOREPO_ROOT = join(PKG_DB, "../../..");

const ENV_CANDIDATES = [".env", ".env.development", ".env.local"];

function resolveEnvFile(): string {
  for (const name of ENV_CANDIDATES) {
    const path = join(MONOREPO_ROOT, name);
    if (existsSync(path)) return path;
  }
  console.error(
    [
      "Nenhum arquivo de ambiente encontrado na raiz do projeto.",
      "",
      "Crie um deles com DATABASE_URL:",
      "  copy .env.example .env",
      "  — ou —",
      "  mantenha .env.development na raiz",
      "",
      `Raiz: ${MONOREPO_ROOT}`,
    ].join("\n"),
  );
  process.exit(1);
}

function loadEnvFile(path: string): Record<string, string> {
  const content = readFileSync(path, "utf8");
  const vars: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const envFile = resolveEnvFile();
const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error("Uso: bun scripts/prisma-env.ts <comando prisma> [args...]");
  console.error("Ex.: bun scripts/prisma-env.ts db push");
  process.exit(1);
}

const require = createRequire(join(DB_ROOT, "package.json"));
const prismaEntry = require.resolve("prisma/build/index.js");

const env = {
  ...process.env,
  ...loadEnvFile(envFile),
};

if (!env.DATABASE_URL) {
  console.error(`DATABASE_URL ausente em ${envFile}`);
  process.exit(1);
}

console.log(`[prisma-env] ${envFile}`);

const result = spawnSync(process.execPath, [prismaEntry, ...prismaArgs], {
  cwd: DB_ROOT,
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
