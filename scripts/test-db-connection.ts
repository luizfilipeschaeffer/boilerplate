#!/usr/bin/env bun
/**
 * Testa conexão com PostgreSQL (Neon) via Prisma.
 * Uso: bun --env-file=.env.vercel.production scripts/test-db-connection.ts
 */
import { PrismaClient } from "../packages/db/src/generated/prisma";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("[test-db] DATABASE_URL ausente.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url } },
  log: ["error"],
});

try {
  const result = await prisma.$queryRaw<[{ ok: number }]>`SELECT 1 AS ok`;
  const count = await prisma.organization.count();
  console.log("[test-db] Conexão OK");
  console.log(`[test-db] SELECT 1 → ${result[0]?.ok}`);
  console.log(`[test-db] organizations no schema → ${count}`);
} catch (err) {
  console.error("[test-db] Falhou:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
