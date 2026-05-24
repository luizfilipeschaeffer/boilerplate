#!/usr/bin/env bun
/**
 * Rotaciona INTEGRATOR_ENCRYPTION_KEY re-criptografando credenciais em batch.
 *
 * Uso:
 *   INTEGRATOR_ENCRYPTION_KEY_OLD=<old> INTEGRATOR_ENCRYPTION_KEY=<new> bun packages/db/scripts/rotate-kek.ts
 */
import { prisma } from "../src/client";
import { decryptEnvelope, encryptEnvelope } from "@boilerplate/shared/secrets";

function kekFromEnv(name: string): Buffer {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`${name} ausente`);
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error(`${name} deve ter 32 bytes base64`);
  return key;
}

async function reencryptField(
  serialized: string | null | undefined,
  oldKek: Buffer,
  newKek: Buffer,
): Promise<string | null> {
  if (!serialized) return null;
  const secrets = decryptEnvelope(serialized, oldKek);
  return encryptEnvelope(secrets, newKek);
}

async function main() {
  const oldKek = kekFromEnv("INTEGRATOR_ENCRYPTION_KEY_OLD");
  const newKek = kekFromEnv("INTEGRATOR_ENCRYPTION_KEY");

  const [platformRows, tenantRows] = await Promise.all([
    prisma.platformIntegratorCredential.findMany({
      select: { integratorId: true, credentialsEncrypted: true },
    }),
    prisma.tenantIntegrator.findMany({
      select: { id: true, credentialsEncrypted: true },
    }),
  ]);

  let rotated = 0;

  for (const row of platformRows) {
    const next = await reencryptField(row.credentialsEncrypted, oldKek, newKek);
    if (!next) continue;
    await prisma.platformIntegratorCredential.update({
      where: { integratorId: row.integratorId },
      data: { credentialsEncrypted: next },
    });
    rotated += 1;
  }

  for (const row of tenantRows) {
    const next = await reencryptField(row.credentialsEncrypted, oldKek, newKek);
    if (!next) continue;
    await prisma.tenantIntegrator.update({
      where: { id: row.id },
      data: { credentialsEncrypted: next },
    });
    rotated += 1;
  }

  console.log(`[rotate-kek] Concluído. ${rotated} credenciais re-criptografadas.`);
}

await main();
