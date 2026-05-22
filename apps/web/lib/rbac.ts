export type TenantRole =
  | "dono"
  | "gerente"
  | "vendedor"
  | "operador"
  | "financeiro";

/** Rotas permitidas por papel (prefixo). Dono/gerente: dashboard completo. */
const ROUTES_BY_ROLE: Record<TenantRole, string[] | "*"> = {
  dono: "*",
  gerente: "*",
  vendedor: [
    "/dashboard",
    "/pedidos",
    "/vendas",
    "/clientes",
    "/crm",
    "/catalogo",
    "/ranking",
    "/conta",
  ],
  operador: [
    "/dashboard",
    "/pedidos",
    "/estoque",
    "/catalogo",
    "/compras",
    "/conta",
  ],
  financeiro: [
    "/dashboard",
    "/fluxo-caixa",
    "/relatorios",
    "/conta",
  ],
};

const MODULE_ROUTE_PREFIX: Record<string, string> = {
  "core-catalogo": "/catalogo",
  "core-clientes": "/clientes",
  "core-crm": "/crm",
  "core-vendas": "/vendas",
  "core-pedidos": "/pedidos",
  "core-estoque-basico": "/estoque",
  "ops-compras": "/compras",
  "core-ranking": "/ranking",
  "fin-fluxo-caixa": "/fluxo-caixa",
  "ops-vendedores": "/vendedores",
  "rel-basico": "/relatorios",
  "ops-multi-loja": "/configuracoes",
  aprendiz: "/aprendiz",
  "evolucao-nav": "/evolucao",
};

export function canAccessRoute(role: string, pathname: string): boolean {
  const r = (role || "dono") as TenantRole;
  const allowed = ROUTES_BY_ROLE[r] ?? "*";
  if (allowed === "*") return true;
  if (pathname.startsWith("/configuracoes") && (r === "dono" || r === "gerente")) {
    return true;
  }
  return allowed.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function filterNavModuleIdsForRole(
  role: string,
  moduleIds: string[],
): string[] {
  const r = (role || "dono") as TenantRole;
  if (r === "dono" || r === "gerente") return moduleIds;
  const allowedPrefixes: Record<string, string[]> = {
    vendedor: [
      "core-catalogo",
      "core-clientes",
      "core-crm",
      "core-vendas",
      "core-pedidos",
      "core-ranking",
    ],
    operador: ["core-catalogo", "core-pedidos", "core-estoque-basico", "ops-compras"],
    financeiro: ["fin-fluxo-caixa", "rel-basico", "core-catalogo"],
  };
  const prefixes = allowedPrefixes[r] ?? [];
  return moduleIds.filter((id) => prefixes.includes(id));
}

export function routeForModuleId(moduleId: string): string | undefined {
  return MODULE_ROUTE_PREFIX[moduleId];
}
