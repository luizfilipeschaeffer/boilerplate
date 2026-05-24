#!/usr/bin/env bun
/**
 * Valida variáveis server-only antes de deploy/CI.
 * Uso: bun scripts/validate-env.ts [--strict]
 */
import { validateServerEnv } from "@boilerplate/shared/env";

const strict = process.argv.includes("--strict");

try {
  validateServerEnv();
  console.log("[validate-env] OK");
} catch (err) {
  if (strict) {
    console.error("[validate-env] Falhou:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
  console.warn("[validate-env] Aviso (modo não-estrito):", err instanceof Error ? err.message : err);
}
