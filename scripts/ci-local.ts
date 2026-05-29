#!/usr/bin/env bun
/**
 * Espelha os jobs do GitHub Actions localmente (CI + ecosystem-security).
 * Uso: bun run ci:local
 *
 * Dica: pare `bun run dev` antes do build para evitar EPERM no Prisma engine (Windows).
 */
import { spawnSync } from "node:child_process";

const steps: Array<{ name: string; cmd: string[] }> = [
  { name: "validate:env", cmd: ["bun", "run", "validate:env"] },
  { name: "audit", cmd: ["bun", "audit", "--audit-level=high"] },
  { name: "db:generate", cmd: ["bun", "run", "db:generate"] },
  { name: "sdk-core test", cmd: ["bun", "run", "--filter", "@boilerplate/sdk-core", "test"] },
  { name: "test:ci", cmd: ["bun", "run", "test:ci"] },
  { name: "check:self-hosted-compose", cmd: ["bun", "run", "check:self-hosted-compose"] },
  { name: "db:validate", cmd: ["bun", "run", "db:validate"] },
  { name: "lint:ecosystem", cmd: ["bun", "run", "lint:ecosystem"] },
  {
    name: "example-module test",
    cmd: ["bun", "run", "--filter", "@boilerplate-community/example-module", "test"],
  },
  {
    name: "capability manifest check",
    cmd: ["bun", "scripts/check-example-module-capabilities.ts"],
  },
  { name: "lint", cmd: ["bun", "run", "lint"] },
  { name: "build", cmd: ["bun", "run", "build"] },
];

let failed = false;

for (const step of steps) {
  console.log(`\n[ci:local] ▶ ${step.name}`);
  const result = spawnSync(step.cmd[0], step.cmd.slice(1), {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`[ci:local] ✗ ${step.name} (exit ${result.status ?? 1})`);
    failed = true;
    break;
  }
  console.log(`[ci:local] ✓ ${step.name}`);
}

if (failed) {
  console.error("\n[ci:local] Falhou — corrija e rode novamente: bun run ci:local");
  process.exit(1);
}

console.log("\n[ci:local] Tudo OK — equivalente ao CI + ecosystem-security.");
process.exit(0);
