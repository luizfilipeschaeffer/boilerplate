const ROLE_LABELS: Record<string, string> = {
  dono: "Dono",
  gerente: "Gerente",
  vendedor: "Vendedor",
  operador: "Operador",
  financeiro: "Financeiro",
};

export const ASSIGNABLE_ROLES = [
  "gerente",
  "vendedor",
  "operador",
  "financeiro",
] as const;

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
