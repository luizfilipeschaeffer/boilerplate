import type { CommandShortcutGroup } from "./shortcut-types";

export type CommandShortcutCatalogEntry = {
  id: string;
  label: string;
  description: string;
  group: CommandShortcutGroup;
  /** Módulo necessário; omitido = sempre disponível (ex.: navegação). */
  moduleId?: string;
};

export const COMMAND_SHORTCUT_CATALOG: CommandShortcutCatalogEntry[] = [
  {
    id: "action:catalogo-novo",
    label: "Novo item no catálogo",
    description: "Abre o catálogo para cadastrar produto ou serviço.",
    group: "comercial",
    moduleId: "core-catalogo",
  },
  {
    id: "action:cliente-novo",
    label: "Novo cliente",
    description: "Cadastro rápido de cliente.",
    group: "comercial",
    moduleId: "core-clientes",
  },
  {
    id: "action:venda-nova",
    label: "Nova venda",
    description: "Inicia uma nova venda.",
    group: "comercial",
    moduleId: "core-vendas",
  },
  {
    id: "action:estoque-movimento",
    label: "Registrar movimento de estoque",
    description: "Entrada ou ajuste de saldo.",
    group: "estoque",
    moduleId: "core-estoque-basico",
  },
  {
    id: "nav:/dashboard",
    label: "Início",
    description: "Painel principal.",
    group: "navegacao",
  },
  {
    id: "nav:/catalogo",
    label: "Catálogo",
    description: "Lista de produtos e serviços.",
    group: "navegacao",
    moduleId: "core-catalogo",
  },
  {
    id: "nav:/clientes",
    label: "Clientes",
    description: "Lista de clientes.",
    group: "navegacao",
    moduleId: "core-clientes",
  },
  {
    id: "nav:/vendas",
    label: "Vendas",
    description: "Histórico e novas vendas.",
    group: "navegacao",
    moduleId: "core-vendas",
  },
  {
    id: "nav:/estoque/produtos",
    label: "Estoque — Produtos",
    description: "Saldos e estoque mínimo.",
    group: "navegacao",
    moduleId: "core-estoque-basico",
  },
  {
    id: "nav:/estoque/movimentacao",
    label: "Estoque — Movimentação",
    description: "Entradas e ajustes.",
    group: "navegacao",
    moduleId: "core-estoque-basico",
  },
];

export const COMMAND_SHORTCUT_GROUP_LABELS: Record<CommandShortcutGroup, string> = {
  comercial: "Comercial",
  estoque: "Estoque",
  navegacao: "Navegação",
};

const GROUP_ORDER: CommandShortcutGroup[] = [
  "comercial",
  "estoque",
  "navegacao",
];

export function shortcutsCatalogByGroup(activeModuleIds: string[]) {
  const active = new Set(activeModuleIds);
  return GROUP_ORDER.map((group) => ({
    group,
    label: COMMAND_SHORTCUT_GROUP_LABELS[group],
    shortcuts: COMMAND_SHORTCUT_CATALOG.filter((entry) => {
      if (entry.group !== group) return false;
      if (!entry.moduleId) return true;
      return active.has(entry.moduleId);
    }),
  })).filter((g) => g.shortcuts.length > 0);
}
