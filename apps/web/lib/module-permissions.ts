import type { TenantRole } from "@/lib/rbac";

export type ModulePermissionKey =
  | "ver"
  | "registrar"
  | "editar"
  | "cancelar"
  | "fechar";

export const PERMISSION_LABELS: Record<ModulePermissionKey, string> = {
  ver: "Ver",
  registrar: "Registrar",
  editar: "Editar",
  cancelar: "Cancelar",
  fechar: "Fechar",
};

/** Matriz PRD §11 — permissões por módulo e papel. */
export const MODULE_PERMISSION_MATRIX: Record<
  string,
  Partial<Record<ModulePermissionKey, TenantRole[]>>
> = {
  "core-catalogo": { ver: ["dono", "gerente", "vendedor", "operador"] },
  "core-clientes": {
    ver: ["dono", "gerente", "vendedor"],
    registrar: ["dono", "gerente", "vendedor"],
  },
  "core-crm": {
    ver: ["dono", "gerente", "vendedor"],
    registrar: ["dono", "gerente", "vendedor"],
    editar: ["dono", "gerente", "vendedor"],
  },
  "core-vendas": {
    ver: ["dono", "gerente", "vendedor"],
    registrar: ["dono", "gerente", "vendedor"],
    cancelar: ["dono", "gerente"],
  },
  "core-pedidos": {
    ver: ["dono", "gerente", "vendedor", "operador"],
    registrar: ["dono", "gerente", "vendedor", "operador"],
    cancelar: ["dono", "gerente"],
  },
  "core-estoque-basico": {
    ver: ["dono", "gerente", "operador"],
    editar: ["dono", "gerente"],
    registrar: ["dono", "gerente", "operador"],
  },
  "core-ranking": { ver: ["dono", "gerente", "vendedor"] },
  "fin-fluxo-caixa": {
    ver: ["dono", "gerente", "financeiro"],
    editar: ["dono", "financeiro"],
    fechar: ["dono"],
  },
  "ops-vendedores": {
    ver: ["dono", "gerente"],
    registrar: ["dono", "gerente"],
    editar: ["dono", "gerente"],
  },
  "rel-basico": { ver: ["dono", "gerente"] },
  "ops-multi-loja": { ver: ["dono", "gerente"], editar: ["dono", "gerente"] },
  "ops-compras": {
    ver: ["dono", "gerente", "operador"],
    registrar: ["dono", "gerente", "operador"],
    editar: ["dono", "gerente"],
    cancelar: ["dono", "gerente"],
  },
  aprendiz: { ver: ["dono", "gerente", "vendedor", "operador"] },
};

const DEFAULT_PERMISSIONS: ModulePermissionKey[] = ["ver"];

export function permissionsForModule(moduleId: string): ModulePermissionKey[] {
  const row = MODULE_PERMISSION_MATRIX[moduleId];
  if (!row) return DEFAULT_PERMISSIONS;
  return Object.keys(row) as ModulePermissionKey[];
}

export function roleHasModulePermission(
  role: string,
  moduleId: string,
  permission: ModulePermissionKey,
): boolean {
  const allowed = MODULE_PERMISSION_MATRIX[moduleId]?.[permission];
  if (!allowed) return permission === "ver";
  return allowed.includes(role as TenantRole);
}

export function grantedPermissionsForRole(
  role: string,
  moduleId: string,
): ModulePermissionKey[] {
  return permissionsForModule(moduleId).filter((p) =>
    roleHasModulePermission(role, moduleId, p),
  );
}

export function parseStoredPermissions(raw: unknown): ModulePermissionKey[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((p): p is ModulePermissionKey =>
      typeof p === "string" && p in PERMISSION_LABELS,
    );
  }
  return [];
}
