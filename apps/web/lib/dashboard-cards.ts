export const DASHBOARD_CARD_IDS = [
  "cash_flow",
  "clients",
  "stock_alerts",
  "sales_today",
  "sales_month",
  "ticket_month",
  "open_orders",
  "catalog_count",
  "active_sellers",
  "ranking_leader",
  "overdue_bills",
] as const;

export type DashboardCardId = (typeof DASHBOARD_CARD_IDS)[number];

export const DEFAULT_DASHBOARD_CARDS: DashboardCardId[] = [
  "cash_flow",
  "clients",
  "stock_alerts",
];

export type DashboardCardGroup =
  | "financeiro"
  | "comercial"
  | "estoque"
  | "equipe";

export const DASHBOARD_CARD_GROUP_LABELS: Record<DashboardCardGroup, string> = {
  financeiro: "Financeiro",
  comercial: "Comercial",
  estoque: "Estoque e catálogo",
  equipe: "Equipe",
};

export const DASHBOARD_CARD_CATALOG: {
  id: DashboardCardId;
  title: string;
  description: string;
  group: DashboardCardGroup;
}[] = [
  {
    id: "cash_flow",
    title: "Fluxo de caixa",
    description: "Saldo realizado, projetado e atalho para o módulo.",
    group: "financeiro",
  },
  {
    id: "overdue_bills",
    title: "Contas em atraso",
    description: "Saídas previstas vencidas no fluxo de caixa.",
    group: "financeiro",
  },
  {
    id: "sales_today",
    title: "Vendas hoje",
    description: "Quantidade e faturamento do dia.",
    group: "comercial",
  },
  {
    id: "sales_month",
    title: "Vendas no mês",
    description: "Total de vendas confirmadas no mês corrente.",
    group: "comercial",
  },
  {
    id: "ticket_month",
    title: "Ticket médio (mês)",
    description: "Valor médio por venda no mês.",
    group: "comercial",
  },
  {
    id: "open_orders",
    title: "Pedidos em aberto",
    description: "Rascunhos e pedidos ainda não convertidos em venda.",
    group: "comercial",
  },
  {
    id: "clients",
    title: "Clientes cadastrados",
    description: "Total de clientes ativos.",
    group: "comercial",
  },
  {
    id: "ranking_leader",
    title: "Produto mais vendido",
    description: "Item em destaque no ranking por quantidade.",
    group: "comercial",
  },
  {
    id: "catalog_count",
    title: "Itens no catálogo",
    description: "Produtos e serviços ativos cadastrados.",
    group: "estoque",
  },
  {
    id: "stock_alerts",
    title: "Alertas de estoque",
    description: "Itens abaixo ou perto do estoque mínimo.",
    group: "estoque",
  },
  {
    id: "active_sellers",
    title: "Vendedores ativos",
    description: "Equipe de vendas habilitada no tenant.",
    group: "equipe",
  },
];

const GROUP_ORDER: DashboardCardGroup[] = [
  "financeiro",
  "comercial",
  "estoque",
  "equipe",
];

export function dashboardCardsByGroup(): {
  group: DashboardCardGroup;
  label: string;
  cards: (typeof DASHBOARD_CARD_CATALOG)[number][];
}[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: DASHBOARD_CARD_GROUP_LABELS[group],
    cards: DASHBOARD_CARD_CATALOG.filter((c) => c.group === group),
  }));
}

export function parseDashboardCardIds(raw: unknown): DashboardCardId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_DASHBOARD_CARDS];
  const valid = new Set(DASHBOARD_CARD_IDS);
  const parsed = raw
    .map(String)
    .filter((id): id is DashboardCardId =>
      valid.has(id as DashboardCardId),
    );
  return parsed.length > 0 ? parsed : [...DEFAULT_DASHBOARD_CARDS];
}

export function isDashboardCardId(value: string): value is DashboardCardId {
  return (DASHBOARD_CARD_IDS as readonly string[]).includes(value);
}
