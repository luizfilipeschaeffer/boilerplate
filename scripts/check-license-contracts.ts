#!/usr/bin/env bun
import { existsSync } from "node:fs";

const files = [
  "packages/platform-api/src/contracts/license.ts",
  "packages/platform-api/src/contracts/marketplace.ts",
  "packages/platform-api/src/contracts/installation.ts",
  "packages/license-client/src/index.ts",
  "packages/module-migration-runner/src/index.ts",
  "packages/module-installer/src/index.ts",
  "infra/self-hosted/docker-compose.yml",
];
for (const f of files) {
  if (!existsSync(f)) {
    console.error(`Missing: ${f}`);
    process.exit(1);
  }
}
console.log("check:license-contracts OK");
