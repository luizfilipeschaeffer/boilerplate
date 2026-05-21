import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MONOREPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const ENV_FILES = [".env", ".env.development", ".env.local"];

function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
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
    vars[key] = value;
  }
  return vars;
}

/** Mescla .env → .env.development → .env.local (último ganha). Sobrescreve variáveis do shell. */
export function loadMonorepoEnv(): string[] {
  const loaded: string[] = [];
  const merged: Record<string, string> = {};

  for (const name of ENV_FILES) {
    const path = join(MONOREPO_ROOT, name);
    if (!existsSync(path)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(path, "utf8")));
    loaded.push(name);
  }

  for (const [key, value] of Object.entries(merged)) {
    process.env[key] = value;
  }

  return loaded;
}
