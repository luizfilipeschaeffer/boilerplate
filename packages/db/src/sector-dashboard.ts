import { prisma } from "./client";

const DEFAULT_CARDS = ["cash_flow", "clients", "stock_alerts"] as const;

const VALID_CARD_IDS = [
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

const VALID_IDS = new Set<string>(VALID_CARD_IDS);

export type SectorDashboardCardId = (typeof DEFAULT_CARDS)[number];

export function parseSectorDashboardCards(raw: unknown): SectorDashboardCardId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CARDS];
  const parsed = raw
    .map(String)
    .filter((id): id is SectorDashboardCardId => VALID_IDS.has(id));
  return parsed.length > 0 ? parsed : [...DEFAULT_CARDS];
}

export async function getSectorDashboardCards(
  organizationId: string,
  sectorSlug: string,
): Promise<SectorDashboardCardId[]> {
  const sector = await prisma.sector.findFirst({
    where: { organizationId, slug: sectorSlug },
    select: { dashboardCards: true },
  });
  if (!sector) return [...DEFAULT_CARDS];
  return parseSectorDashboardCards(sector.dashboardCards);
}

export async function saveSectorDashboardCards(
  organizationId: string,
  sectorSlug: string,
  cardIds: string[],
): Promise<SectorDashboardCardId[]> {
  const unique = [...new Set(cardIds)].filter((id) => VALID_IDS.has(id));
  if (unique.length === 0) {
    throw new Error("Selecione ao menos um card para o painel.");
  }

  await prisma.sector.update({
    where: {
      organizationId_slug: { organizationId, slug: sectorSlug },
    },
    data: { dashboardCards: unique },
  });

  return unique as SectorDashboardCardId[];
}
