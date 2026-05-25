import type { ModuleDefinition } from "@boilerplate/shared";
import type { BoilerplateModule, ModuleCapabilities, Permission } from "@boilerplate/sdk-core";
import { CORE_CONTRACT_VERSION, mergeCapabilities } from "@boilerplate/sdk-core";

export function legacyModuleDefinitionToV1(def: ModuleDefinition): BoilerplateModule {
  return {
    id: def.id,
    version: "1.0.0",
    coreContract: `^${CORE_CONTRACT_VERSION}`,
    capabilities: mergeCapabilities({
      database: def.implementationStatus === "implemented",
    }),
    requiredPermissions: [`${def.id}.read` as Permission],
    routes: def.routes.map((r) => ({ path: r.path, label: r.label })),
    segment: def.tiposNegocioElegiveis,
  };
}

export function toModuleCapabilities(def: ModuleDefinition): ModuleCapabilities {
  return mergeCapabilities({
    database: def.implementationStatus === "implemented",
    billing: def.id.includes("billing"),
    ai: def.id.includes("aprendiz"),
  });
}
