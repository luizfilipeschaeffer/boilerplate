#!/usr/bin/env bun
/**
 * Remove node_modules e pastas de cache/build em todo o monorepo.
 * Não entra em .git. Pastas alvo são removidas inteiras (não desce em node_modules).
 */
import { readdir, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Pastas removidas em qualquer workspace (apps/*, packages/*, example, raiz). */
const REMOVE_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "coverage",
  ".vercel",
  "out",
  ".cache",
]);

const SKIP_DIRS = new Set([".git"]);

async function cleanDir(dir: string): Promise<string[]> {
  const removed: string[] = [];
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return removed;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const name = entry.name;
    if (SKIP_DIRS.has(name)) continue;

    const full = join(dir, name);

    if (REMOVE_DIRS.has(name)) {
      try {
        await rm(full, { recursive: true, force: true });
        removed.push(relative(ROOT, full));
      } catch (err) {
        console.error(`Falha ao remover ${relative(ROOT, full)}:`, err);
      }
      continue;
    }

    removed.push(...(await cleanDir(full)));
  }

  return removed;
}

console.log("Limpando node_modules e pastas temporárias...\n");

const removed = await cleanDir(ROOT);

if (removed.length === 0) {
  console.log("Nada para remover.");
} else {
  for (const p of removed.sort()) {
    console.log(`  ✓ ${p}`);
  }
  console.log(`\n${removed.length} pasta(s) removida(s).`);
  console.log("Rode `bun install` na raiz para reinstalar as dependências.");
}
