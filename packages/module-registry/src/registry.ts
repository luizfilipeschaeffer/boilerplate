import type { ModuleDefinition } from "@boilerplate/shared";

const registry = new Map<string, ModuleDefinition>();

export function registerModule(def: ModuleDefinition): void {
  registry.set(def.id, def);
}

export function getModule(id: string): ModuleDefinition | undefined {
  return registry.get(id);
}

export function getAllModules(): ModuleDefinition[] {
  return [...registry.values()];
}

export function getModulesByIds(ids: string[]): ModuleDefinition[] {
  return ids
    .map((id) => registry.get(id))
    .filter((m): m is ModuleDefinition => m !== undefined);
}

export function getNavItemsForModules(moduleIds: string[]): ModuleDefinition["navItems"] {
  return getModulesByIds(moduleIds)
    .flatMap((m) => m.navItems)
    .sort((a, b) => a.ordem - b.ordem);
}
