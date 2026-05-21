#!/usr/bin/env bun
/**
 * Reinicia o banco local: remove schemas tenant, recria o schema boilerplate (Prisma)
 * e aplica o seed do platform-admin.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLATFORM_SCHEMA } from "../src/platform-schema";
import { loadMonorepoEnv } from "./load-monorepo-env";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const DB_ROOT = join(SCRIPTS_DIR, "..");

const loaded = loadMonorepoEnv();
if (loaded.length > 0) {
  console.log(`[db:restart] env: ${loaded.join(" → ")}`);
}

assertRestartAllowed();

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL ausente. Verifique .env / .env.development.");
}

console.log("[db:restart] 1/4 — gerando Prisma Client…");
runPrisma(["generate"]);

console.log("[db:restart] 2/4 — removendo schemas tenant_*…");
await dropTenantSchemas();

console.log("[db:restart] 3/4 — recriando schema boilerplate…");
await resetPlatformSchema();
runPrisma(["db", "push"]);

console.log("[db:restart] 4/4 — seed platform-admin…");
const seed = spawnSync(process.execPath, ["./scripts/seed-platform-admin.ts"], {
  cwd: DB_ROOT,
  env: process.env,
  stdio: "inherit",
});

if (seed.status !== 0) {
  process.exit(seed.status ?? 1);
}

console.log("[db:restart] concluído.");

function assertRestartAllowed(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "production") return;

  if (process.env.ALLOW_DB_RESTART !== "true") {
    fail(
      [
        "db:restart bloqueado em NODE_ENV=production.",
        "",
        "Para ambiente efêmero (staging/review), defina explicitamente:",
        "  ALLOW_DB_RESTART=true",
      ].join("\n"),
    );
  }

  console.warn(
    "[db:restart] AVISO: reset em production com ALLOW_DB_RESTART=true",
  );
}

async function withPrisma<T>(fn: (prisma: import("../src/client").PrismaClient) => Promise<T>): Promise<T> {
  const { prisma } = await import("../src/client");
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function dropTenantSchemas(): Promise<void> {
  await withPrisma(async (prisma) => {
    const rows = await prisma.$queryRaw<{ schema_name: string }[]>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant\_%' ESCAPE '\'
    `;

    if (rows.length === 0) {
      console.log("[db:restart] nenhum schema tenant encontrado.");
      return;
    }

    for (const { schema_name } of rows) {
      console.log(`[db:restart] drop schema ${schema_name}`);
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`,
      );
    }
  });
}

/** Zera todas as tabelas do Prisma (schema global) sem depender de --force-reset. */
async function resetPlatformSchema(): Promise<void> {
  await withPrisma(async (prisma) => {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${PLATFORM_SCHEMA}" CASCADE`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${PLATFORM_SCHEMA}"`);
    await prisma.$executeRawUnsafe(
      `GRANT ALL ON SCHEMA "${PLATFORM_SCHEMA}" TO CURRENT_USER`,
    );
  });
}

function runPrisma(args: string[]): void {
  const result = spawnSync(process.execPath, ["./scripts/prisma-env.ts", ...args], {
    cwd: DB_ROOT,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
