#!/usr/bin/env bun
/**
 * Gera o Prisma Client sem exigir .env na raiz (CI / Vercel).
 * Ordem: process.env.DATABASE_URL → arquivos .env na raiz → URL placeholder (só generate).
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DB = dirname(fileURLToPath(import.meta.url));
const DB_ROOT = join(PKG_DB, "..");
const MONOREPO_ROOT = join(PKG_DB, "../../..");

const PLACEHOLDER_DATABASE_URL =
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=boilerplate";

function parseDatabaseUrlFromFile(path: string): string | undefined {
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.startsWith("DATABASE_URL=")) continue;
    let value = trimmed.slice("DATABASE_URL=".length).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value || undefined;
  }
  return undefined;
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  for (const name of [".env", ".env.development", ".env.local"]) {
    const path = join(MONOREPO_ROOT, name);
    if (!existsSync(path)) continue;
    const fromFile = parseDatabaseUrlFromFile(path);
    if (fromFile) return fromFile;
  }

  return PLACEHOLDER_DATABASE_URL;
}

const require = createRequire(join(DB_ROOT, "package.json"));
const prismaEntry = require.resolve("prisma/build/index.js");

const databaseUrl = resolveDatabaseUrl();
if (databaseUrl === PLACEHOLDER_DATABASE_URL) {
  console.log("[generate-client] DATABASE_URL ausente — usando placeholder (apenas generate)");
} else if (process.env.DATABASE_URL) {
  console.log("[generate-client] DATABASE_URL de process.env");
} else {
  console.log("[generate-client] DATABASE_URL de arquivo .env na raiz");
}

const result = spawnSync(process.execPath, [prismaEntry, "generate"], {
  cwd: DB_ROOT,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
