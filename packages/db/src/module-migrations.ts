import type { ModuleMigrationFn } from "@boilerplate/sdk-core";
import { registerModuleTables } from "@boilerplate/module-registry";

registerModuleTables("crm", [
  { name: "crm_leads", description: "CRM leads" },
  { name: "crm_deals", description: "CRM deals" },
  { name: "crm_notes", description: "CRM notes" },
]);

registerModuleTables("catalog", [
  { name: "catalog_items", description: "Catalog items" },
]);

registerModuleTables("example-module", [
  { name: "example_module_items", description: "Example module items" },
]);

const moduleMigrations = new Map<string, ModuleMigrationFn[]>();

export function registerModuleMigrations(moduleId: string, migrations: ModuleMigrationFn[]): void {
  moduleMigrations.set(moduleId, migrations);
}

export function getModuleMigrations(moduleId: string): ModuleMigrationFn[] {
  return moduleMigrations.get(moduleId) ?? [];
}

export async function runModuleMigrationsForTenant(opts: {
  schemaName: string;
  organizationId: string;
  activeModuleIds: string[];
}): Promise<void> {
  for (const moduleId of opts.activeModuleIds) {
    const migrations = getModuleMigrations(moduleId);
    for (const migrate of migrations) {
      await migrate({
        schemaName: opts.schemaName,
        organizationId: opts.organizationId,
        fromVersion: "0.0.0",
        toVersion: "1.0.0",
      });
    }
  }
}
