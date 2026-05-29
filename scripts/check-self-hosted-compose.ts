#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs";

const requiredServices = ["web", "worker", "postgres", "redis", "license-agent"] as const;

function assertCompose(path: string, label: string): void {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path}`);
    process.exit(1);
  }
  const text = readFileSync(path, "utf8");
  for (const svc of requiredServices) {
    if (!text.includes(`${svc}:`)) {
      console.error(`${label}: missing service ${svc}`);
      process.exit(1);
    }
  }
}

const dockerfiles = [
  "infra/self-hosted/Dockerfile.web",
  "infra/self-hosted/Dockerfile.worker",
  "infra/self-hosted/Dockerfile.license-agent",
] as const;

for (const df of dockerfiles) {
  if (!existsSync(df)) {
    console.error(`Missing Dockerfile: ${df}`);
    process.exit(1);
  }
}

assertCompose("infra/self-hosted/docker-compose.yml", "docker-compose.yml");
assertCompose("infra/self-hosted/docker-compose.prod.yml", "docker-compose.prod.yml");

if (!existsSync("infra/self-hosted/.env.example")) {
  console.error("Missing infra/self-hosted/.env.example");
  process.exit(1);
}

if (!existsSync("infra/self-hosted/install-vps.sh")) {
  console.error("Missing infra/self-hosted/install-vps.sh");
  process.exit(1);
}

console.log("check:self-hosted-compose OK");
