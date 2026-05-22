import {
  roleHasModulePermission,
  type ModulePermissionKey,
} from "@/lib/module-permissions";

export const COMPRAS_MODULE_ID = "ops-compras";

export const COMPRAS_ROUTES = {
  home: "/compras",
  fornecedores: "/compras/fornecedores",
} as const;

export function canViewCompras(role: string): boolean {
  return roleHasModulePermission(role, COMPRAS_MODULE_ID, "ver");
}

export function canEditCompras(role: string): boolean {
  return roleHasModulePermission(role, COMPRAS_MODULE_ID, "editar");
}

export function canRegisterCompras(role: string): boolean {
  return roleHasModulePermission(role, COMPRAS_MODULE_ID, "registrar");
}

export function canCancelCompras(role: string): boolean {
  return roleHasModulePermission(role, COMPRAS_MODULE_ID, "cancelar");
}

export function assertComprasPermission(
  role: string,
  permission: ModulePermissionKey,
): void {
  if (!roleHasModulePermission(role, COMPRAS_MODULE_ID, permission)) {
    throw new Error("Sem permissão para esta ação em Compras.");
  }
}
