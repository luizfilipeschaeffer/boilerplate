#!/usr/bin/env bun
/**
 * Copia o Prisma Client gerado para apps/* — paths que o runtime procura na Vercel
 * (/var/task/apps/web/src/generated/prisma).
 *
 * Uso: bun scripts/sync-prisma-engine-to-apps.ts
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "packages/db/src/generated/prisma");
const APPS = ["apps/web", "apps/platform-admin"] as const;

const ENGINE = "libquery_engine-rhel-openssl-3.0.x.so.node";

if (!existsSync(join(SOURCE, ENGINE))) {
  console.error(
    `[sync-prisma-engine] Engine ausente em ${SOURCE}. Rode: bun run db:generate`,
  );
  process.exit(1);
}

for (const app of APPS) {
  const target = join(ROOT, app, "src/generated/prisma");
  mkdirSync(target, { recursive: true });
  cpSync(SOURCE, target, { recursive: true, force: true });
  console.log(`[sync-prisma-engine] ${app}/src/generated/prisma`);
}

console.log("[sync-prisma-engine] OK");
