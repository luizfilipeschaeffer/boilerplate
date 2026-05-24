#!/usr/bin/env bun
/**
 * Seed de credenciais fake de integradores para desenvolvimento local.
 * Requer INTEGRATOR_ENCRYPTION_KEY no .env / .env.development.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { upsertPlatformCredential } from "../src/integrator-credentials";

const PKG_DB = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = join(PKG_DB, "../../..");

const ENV_CANDIDATES = [".env", ".env.development", ".env.local"];

function loadEnv(): void {
  for (const name of ENV_CANDIDATES) {
    const path = join(MONOREPO_ROOT, name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
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
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

type SeedFile = {
  platformDefaults: Record<
    string,
    {
      secrets: Record<string, string>;
      configPublic?: Record<string, unknown>;
    }
  >;
};

async function main(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const isPreview = process.env.VERCEL_ENV === "preview";
  const allowSeed = process.env.ALLOW_INTEGRATOR_CREDENTIALS_SEED === "true";

  if (isProduction && !allowSeed) {
    console.error(
      "Seed de credenciais bloqueado em production. Defina ALLOW_INTEGRATOR_CREDENTIALS_SEED=true em ambientes demo/staging.",
    );
    process.exit(1);
  }

  if (isProduction && allowSeed) {
    console.warn(
      "[seed-integrator-credentials] AVISO: gravando credenciais demo em production (ALLOW_INTEGRATOR_CREDENTIALS_SEED=true)",
    );
  }

  if (isPreview && allowSeed) {
    console.log(
      "[seed-integrator-credentials] Preview Vercel — credenciais demo para validação de integradores.",
    );
  }

  loadEnv();

  if (!process.env.INTEGRATOR_ENCRYPTION_KEY?.trim()) {
    console.error(
      "INTEGRATOR_ENCRYPTION_KEY ausente. Gere com: openssl rand -base64 32",
    );
    process.exit(1);
  }

  const seedPath = join(PKG_DB, "../data/integrator-secrets.dev.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as SeedFile;

  let count = 0;
  for (const [integratorId, entry] of Object.entries(seed.platformDefaults)) {
    await upsertPlatformCredential({
      integratorId,
      secrets: entry.secrets,
      configPublic: entry.configPublic ?? {},
    });
    count += 1;
    console.log(`[seed] credencial plataforma: ${integratorId}`);
  }

  console.log(`[seed] ${count} credencial(is) de integrador gravada(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
