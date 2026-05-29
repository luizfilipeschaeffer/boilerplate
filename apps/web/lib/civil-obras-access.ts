import {
  roleHasModulePermission,
  type ModulePermissionKey,
} from "@/lib/module-permissions";

export const CIVIL_OBRAS_MODULE_ID = "civil-obras";

export const CIVIL_OBRAS_ROUTES = {
  home: "/civil-obras",
  nova: "/civil-obras/nova",
  obra: (obraId: string) => `/civil-obras/${obraId}`,
  diario: (obraId: string) => `/civil-obras/${obraId}/diario`,
  diarioNova: (obraId: string) => `/civil-obras/${obraId}/diario/nova`,
  calendario: (obraId: string) => `/civil-obras/${obraId}/calendario`,
  relatorio: (obraId: string) => `/civil-obras/${obraId}/relatorio`,
  usuarios: (obraId: string) => `/civil-obras/${obraId}/usuarios`,
  busca: (obraId: string) => `/civil-obras/${obraId}/busca`,
} as const;

/** Mapeamento contrato → matriz PRD: admin ≈ editar, colaborador ≈ registrar, visualizador ≈ ver */
export function canViewCivilObras(role: string): boolean {
  return roleHasModulePermission(role, CIVIL_OBRAS_MODULE_ID, "ver");
}

export function canAdminCivilObras(role: string): boolean {
  return roleHasModulePermission(role, CIVIL_OBRAS_MODULE_ID, "editar");
}

export function canColaboradorCivilObras(role: string): boolean {
  return roleHasModulePermission(role, CIVIL_OBRAS_MODULE_ID, "registrar");
}

export function assertCivilObrasPermission(
  role: string,
  level: "admin" | "colaborador" | "visualizador",
): void {
  const map: Record<typeof level, ModulePermissionKey> = {
    admin: "editar",
    colaborador: "registrar",
    visualizador: "ver",
  };
  if (!roleHasModulePermission(role, CIVIL_OBRAS_MODULE_ID, map[level])) {
    throw new Error("Sem permissão para esta ação em Gestão de Obras.");
  }
}
