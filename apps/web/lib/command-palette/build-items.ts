import type { NavItem } from "@boilerplate/shared";

import {
  canRegisterEstoqueMovimentacao,
  canViewEstoque,
  ESTOQUE_ROUTES,
} from "@/lib/estoque-access";
import { canAccessRoute } from "@/lib/rbac";
import type {
  CachedCatalogItem,
  CachedClient,
  CachedSale,
} from "@/lib/idb/types";
import { formatBrl } from "@/lib/format-money";

import type { CommandPaletteItem } from "./types";

const MAX_DATA_RESULTS = 40;

function item(
  partial: Omit<CommandPaletteItem, "keywords"> & { keywords?: string },
): CommandPaletteItem {
  const keywords =
    partial.keywords ??
    [partial.label, partial.description, partial.group, partial.href]
      .filter(Boolean)
      .join(" ");
  return { ...partial, keywords };
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

export function buildNavigationItems(
  navItems: NavItem[],
  activeModuleIds: string[],
  role: string,
): CommandPaletteItem[] {
  const seen = new Set<string>();
  const items: CommandPaletteItem[] = [];

  const push = (href: string, label: string, description?: string) => {
    if (!canAccessRoute(role, href) || seen.has(href)) return;
    seen.add(href);
    items.push(
      item({
        id: `nav:${href}`,
        group: "Navegação",
        label,
        description,
        href,
      }),
    );
  };

  push("/dashboard", "Início", "Painel principal");

  for (const nav of navItems) {
    if (nav.href === "/dashboard") continue;
    push(nav.href, nav.label);
  }

  if (activeModuleIds.includes("core-estoque-basico") && canViewEstoque(role)) {
    push(ESTOQUE_ROUTES.produtos, "Estoque — Produtos", "Saldos e estoque mínimo");
    push(
      ESTOQUE_ROUTES.movimentacao,
      "Estoque — Movimentação",
      "Entradas e ajustes de saldo",
    );
  }

  return items;
}

export function buildQuickActionItems(
  activeModuleIds: string[],
  role: string,
): CommandPaletteItem[] {
  const items: CommandPaletteItem[] = [];

  if (activeModuleIds.includes("core-catalogo") && canAccessRoute(role, "/catalogo")) {
    items.push(
      item({
        id: "action:catalogo-novo",
        group: "Ações rápidas",
        label: "Novo item no catálogo",
        href: "/catalogo?novo=1",
      }),
    );
  }

  if (activeModuleIds.includes("core-clientes") && canAccessRoute(role, "/clientes")) {
    items.push(
      item({
        id: "action:cliente-novo",
        group: "Ações rápidas",
        label: "Novo cliente",
        href: "/clientes?novo=1",
      }),
    );
  }

  if (activeModuleIds.includes("core-crm") && canAccessRoute(role, "/crm")) {
    items.push(
      item({
        id: "nav:crm",
        group: "Navegação",
        label: "CRM Comercial",
        href: "/crm",
      }),
    );
  }

  if (activeModuleIds.includes("core-vendas") && canAccessRoute(role, "/vendas")) {
    items.push(
      item({
        id: "action:venda-nova",
        group: "Ações rápidas",
        label: "Nova venda",
        href: "/vendas?novo=1",
      }),
    );
  }

  if (
    activeModuleIds.includes("core-estoque-basico") &&
    canRegisterEstoqueMovimentacao(role)
  ) {
    items.push(
      item({
        id: "action:estoque-movimento",
        group: "Ações rápidas",
        label: "Registrar movimento de estoque",
        href: ESTOQUE_ROUTES.movimentacao,
      }),
    );
  }

  return items;
}

/** Atalhos configuráveis (setor / usuário) exibidos em «Ações rápidas». */
export function buildShortcutActionItems(
  shortcutIds: string[],
  navItems: NavItem[],
  activeModuleIds: string[],
  role: string,
): CommandPaletteItem[] {
  const quick = buildQuickActionItems(activeModuleIds, role);
  const nav = buildNavigationItems(navItems, activeModuleIds, role);
  const byId = new Map([...quick, ...nav].map((entry) => [entry.id, entry]));
  const result: CommandPaletteItem[] = [];
  const seenHref = new Set<string>();

  for (const id of shortcutIds) {
    const entry = byId.get(id);
    if (!entry || seenHref.has(entry.href)) continue;
    seenHref.add(entry.href);
    result.push({
      ...entry,
      group: "Ações rápidas",
    });
  }

  return result;
}

export function buildDataSearchItems(
  activeModuleIds: string[],
  query: string,
  data: {
    catalog: CachedCatalogItem[];
    clients: CachedClient[];
    sales: CachedSale[];
  },
): CommandPaletteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const items: CommandPaletteItem[] = [];

  if (activeModuleIds.includes("core-catalogo")) {
    for (const row of data.catalog) {
      if (!row.active) continue;
      const hay = [row.name, row.sku ?? "", row.itemType].join(" ");
      if (!matchesQuery(hay, q)) continue;
      items.push(
        item({
          id: `catalog:${row.id}`,
          group: "Catálogo",
          label: row.name,
          description: [
            row.itemType === "produto" ? "Produto" : "Serviço",
            row.sku ? `SKU ${row.sku}` : null,
            row.priceCents != null ? formatBrl(row.priceCents) : null,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/catalogo",
          keywords: `${row.name} ${row.sku ?? ""} catalogo`,
        }),
      );
      if (items.filter((i) => i.group === "Catálogo").length >= MAX_DATA_RESULTS) break;
    }
  }

  if (activeModuleIds.includes("core-clientes")) {
    for (const row of data.clients) {
      if (!row.active) continue;
      const hay = [row.name, row.email ?? "", row.phone ?? ""].join(" ");
      if (!matchesQuery(hay, q)) continue;
      items.push(
        item({
          id: `client:${row.id}`,
          group: "Clientes",
          label: row.name,
          description: [row.email, row.phone].filter(Boolean).join(" · ") || undefined,
          href: "/clientes",
          keywords: `${row.name} ${row.email ?? ""} clientes`,
        }),
      );
      if (items.filter((i) => i.group === "Clientes").length >= MAX_DATA_RESULTS) break;
    }
  }

  if (activeModuleIds.includes("core-vendas")) {
    for (const row of data.sales) {
      const hay = [
        row.clientName ?? "",
        row.id,
        row.status,
        ...row.items.map((it) => it.itemName),
      ].join(" ");
      if (!matchesQuery(hay, q)) continue;
      items.push(
        item({
          id: `sale:${row.id}`,
          group: "Vendas",
          label: row.clientName ?? `Venda ${row.id.slice(0, 8)}`,
          description: `${formatBrl(row.totalCents)} · ${row.status}`,
          href: "/vendas",
          keywords: `${row.clientName ?? ""} venda ${row.id}`,
        }),
      );
      if (items.filter((i) => i.group === "Vendas").length >= MAX_DATA_RESULTS) break;
    }
  }

  if (activeModuleIds.includes("core-estoque-basico")) {
    for (const row of data.catalog) {
      if (row.itemType !== "produto" || !row.active) continue;
      const hay = [row.name, row.sku ?? "", String(row.stockQty)].join(" ");
      if (!matchesQuery(hay, q)) continue;
      items.push(
        item({
          id: `stock:${row.id}`,
          group: "Estoque",
          label: row.name,
          description: `Saldo ${row.stockQty} · mín. ${row.stockMin}`,
          href: ESTOQUE_ROUTES.produtos,
          keywords: `${row.name} estoque produto`,
        }),
      );
      if (items.filter((i) => i.group === "Estoque").length >= MAX_DATA_RESULTS) break;
    }
  }

  return items;
}
