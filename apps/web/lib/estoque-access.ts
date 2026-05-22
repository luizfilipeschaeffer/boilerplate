import {
  roleHasModulePermission,
  type ModulePermissionKey,
} from "@/lib/module-permissions";

export const ESTOQUE_MODULE_ID = "core-estoque-basico";

export const ESTOQUE_ROUTES = {
  root: "/estoque",
  produtos: "/estoque/produtos",
  movimentacao: "/estoque/movimentacao",
} as const;

export function canViewEstoque(role: string): boolean {
  return roleHasModulePermission(role, ESTOQUE_MODULE_ID, "ver");
}

export function canEditEstoqueProdutos(role: string): boolean {
  return roleHasModulePermission(role, ESTOQUE_MODULE_ID, "editar");
}

export function canRegisterEstoqueMovimentacao(role: string): boolean {
  return roleHasModulePermission(role, ESTOQUE_MODULE_ID, "registrar");
}

export function defaultEstoquePath(role: string): string {
  if (canRegisterEstoqueMovimentacao(role)) {
    return ESTOQUE_ROUTES.movimentacao;
  }
  if (canViewEstoque(role)) {
    return ESTOQUE_ROUTES.produtos;
  }
  return "/dashboard";
}

export function assertEstoquePermission(
  role: string,
  permission: ModulePermissionKey,
): void {
  if (!roleHasModulePermission(role, ESTOQUE_MODULE_ID, permission)) {
    throw new Error("Sem permissão para esta operação no módulo de estoque.");
  }
}
