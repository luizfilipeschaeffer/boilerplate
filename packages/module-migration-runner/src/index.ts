import { createHash } from "node:crypto";
import type { ModuleMigrationManifest } from "@boilerplate/platform-api";
import {
  getModuleMigrations,
  runModuleMigrationsForTenant,
} from "@boilerplate/db";
import {
  isMigrationAlreadyApplied,
  recordModuleMigrationHistory,
} from "@boilerplate/db/self-hosted";
import { prisma } from "@boilerplate/db";

export function computeMigrationChecksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function runManifestMigrations(opts: {
  manifest: ModuleMigrationManifest;
  schemaNames: string[];
  organizationIds: string[];
  activeModuleIds: string[];
  backupConfirmed?: boolean;
}): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];
  for (const migration of opts.manifest.migrations) {
    if (migration.direction !== "up") continue;
    if (migration.requiresBackup && !opts.backupConfirmed) {
      errors.push(`Migration ${migration.id} requires backup confirmation`);
      continue;
    }
    const already = await isMigrationAlreadyApplied(
      opts.manifest.moduleId,
      migration.id,
    );
    if (already) continue;

    try {
      if (migration.tenantScoped) {
        for (let i = 0; i < opts.schemaNames.length; i++) {
          const schemaName = opts.schemaNames[i]!;
          const organizationId = opts.organizationIds[i]!;
          await runModuleMigrationsForTenant({
            schemaName,
            organizationId,
            activeModuleIds: opts.activeModuleIds,
          });
        }
      }
      await recordModuleMigrationHistory({
        moduleId: opts.manifest.moduleId,
        migrationId: migration.id,
        version: opts.manifest.version,
        checksum: migration.checksum,
        status: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await recordModuleMigrationHistory({
        moduleId: opts.manifest.moduleId,
        migrationId: migration.id,
        version: opts.manifest.version,
        checksum: migration.checksum,
        status: "failed",
        errorMessage: message,
      });
      errors.push(message);
    }
  }
  return { ok: errors.length === 0, errors };
}

export async function listTenantContexts(): Promise<
  { schemaName: string; organizationId: string }[]
> {
  const orgs = await prisma.organization.findMany({
    select: { id: true, schemaName: true },
  });
  return orgs.map((o) => ({ schemaName: o.schemaName, organizationId: o.id }));
}

export { getModuleMigrations };
