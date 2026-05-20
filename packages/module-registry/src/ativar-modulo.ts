import type { ModuleDefinition } from "@boilerplate/shared";
import { getModule } from "./registry";

export class ModuleActivationError extends Error {}

export async function validateModuleActivation(
  moduloId: string,
  modulosAtivos: string[],
): Promise<ModuleDefinition> {
  const modulo = getModule(moduloId);
  if (!modulo) {
    throw new ModuleActivationError(`Módulo não encontrado: ${moduloId}`);
  }

  for (const dep of modulo.dependencias) {
    if (!modulosAtivos.includes(dep)) {
      throw new ModuleActivationError(`Dependência não atendida: ${dep}`);
    }
  }

  if (modulo.parentModuleId && !modulosAtivos.includes(modulo.parentModuleId)) {
    throw new ModuleActivationError(
      `Módulo pai obrigatório: ${modulo.parentModuleId}`,
    );
  }

  return modulo;
}

/** Persistência (DB), migrations e cache — implementar com @boilerplate/db */
export async function ativarModulo(
  _tenantId: string,
  moduloId: string,
  modulosAtivos: string[],
): Promise<string[]> {
  const modulo = await validateModuleActivation(moduloId, modulosAtivos);
  const next = new Set(modulosAtivos);
  next.add(modulo.id);
  if (modulo.parentModuleId) next.add(modulo.parentModuleId);
  return [...next];
}
