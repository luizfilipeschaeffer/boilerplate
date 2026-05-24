import type { ModuleTableDef } from "@boilerplate/sdk-core";

const globalRegistry = new Map<string, { moduleId: string; table: ModuleTableDef }>();

export class SchemaRegistryConflictError extends Error {
  constructor(tableName: string, existingModule: string, newModule: string) {
    super(
      `Table '${tableName}' already registered by module '${existingModule}' (conflict with '${newModule}')`,
    );
    this.name = "SchemaRegistryConflictError";
  }
}

export function assertModuleTablePrefix(moduleId: string, tableName: string): void {
  const normalized = moduleId.replace(/-/g, "_");
  if (!tableName.startsWith(`${normalized}_`) && !tableName.startsWith(`${moduleId}_`)) {
    throw new Error(
      `Table '${tableName}' must be prefixed with module id '${moduleId}_'`,
    );
  }
}

export function registerModuleTables(moduleId: string, tables: ModuleTableDef[]): void {
  for (const table of tables) {
    assertModuleTablePrefix(moduleId, table.name);
    const existing = globalRegistry.get(table.name);
    if (existing && existing.moduleId !== moduleId) {
      throw new SchemaRegistryConflictError(table.name, existing.moduleId, moduleId);
    }
    globalRegistry.set(table.name, { moduleId, table });
  }
}

export function getRegisteredTables(moduleId?: string): ModuleTableDef[] {
  return [...globalRegistry.values()]
    .filter((e) => !moduleId || e.moduleId === moduleId)
    .map((e) => e.table);
}

export function getModuleForTable(tableName: string): string | undefined {
  return globalRegistry.get(tableName)?.moduleId;
}

export function validateMigrationTables(moduleId: string, tableNames: string[]): void {
  for (const name of tableNames) {
    assertModuleTablePrefix(moduleId, name);
    registerModuleTables(moduleId, [{ name }]);
  }
}

export function clearSchemaRegistry(): void {
  globalRegistry.clear();
}
