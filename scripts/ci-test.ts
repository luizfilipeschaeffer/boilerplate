#!/usr/bin/env bun
/**
 * Testes executados no CI e antes do publish Docker.
 * Apenas pacotes com arquivos *.test.ts — evita falha em pacotes sem suíte.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const packages = [
  "@boilerplate/sdk-core",
  "@boilerplate/shared",
  "@boilerplate/db",
  "@boilerplate/crm-helpdesk-module",
  "@boilerplate-community/example-module",
] as const;

for (const pkg of packages) {
  console.log(`\n[ci-test] ▶ ${pkg}`);
  const result = spawnSync("bun", ["run", "--filter", pkg, "test"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if ((result.status ?? 1) !== 0) {
    console.error(`[ci-test] ✗ ${pkg}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n[ci-test] OK");
