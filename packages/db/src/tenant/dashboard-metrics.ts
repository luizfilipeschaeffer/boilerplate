import { getPeriodReport, listOverduePayables } from "./reports";
import { getTopItems } from "./ranking";
import { listCatalogItems } from "./catalog";
import { listSellers } from "./sellers";
import { assertSafeSchemaName, tenantSalesTable } from "./schema";
import { prisma } from "../client";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export interface DashboardSalesSnapshot {
  count: number;
  totalCents: number;
  ticketMedioCents: number;
}

export interface DashboardMetricsExtras {
  salesToday: DashboardSalesSnapshot;
  salesMonth: DashboardSalesSnapshot;
  openOrdersCount: number;
  catalogActiveCount: number;
  activeSellersCount: number;
  topProduct: { name: string; totalQty: number; totalCents: number } | null;
  overdueCount: number;
  overdueTotalCents: number;
}

export async function getDashboardMetricsExtras(
  schemaName: string,
): Promise<DashboardMetricsExtras> {
  const today = todayIso();
  const monthStart = monthStartIso();

  const [
    salesTodayReport,
    salesMonthReport,
    openOrdersCount,
    catalogItems,
    sellers,
    topItems,
    overdue,
  ] = await Promise.all([
    getPeriodReport(schemaName, today, today),
    getPeriodReport(schemaName, monthStart, today),
    countOpenOrders(schemaName),
    listCatalogItems(schemaName),
    listSellers(schemaName),
    getTopItems(schemaName, 1),
    listOverduePayables(schemaName),
  ]);

  return {
    salesToday: {
      count: salesTodayReport.saleCount,
      totalCents: salesTodayReport.revenueCents,
      ticketMedioCents: salesTodayReport.ticketMedioCents,
    },
    salesMonth: {
      count: salesMonthReport.saleCount,
      totalCents: salesMonthReport.revenueCents,
      ticketMedioCents: salesMonthReport.ticketMedioCents,
    },
    openOrdersCount,
    catalogActiveCount: catalogItems.filter((i) => i.active).length,
    activeSellersCount: sellers.filter((s) => s.active).length,
    topProduct: topItems[0]
      ? {
          name: topItems[0].name,
          totalQty: topItems[0].total_qty,
          totalCents: topItems[0].total_cents,
        }
      : null,
    overdueCount: overdue.length,
    overdueTotalCents: overdue.reduce((s, p) => s + p.amount_cents, 0),
  };
}

async function countOpenOrders(schemaName: string): Promise<number> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM ${salesTable}
     WHERE status IN ('pedido', 'rascunho')`,
  );
  return Number(rows[0]?.count ?? 0);
}
