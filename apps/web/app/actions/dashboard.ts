"use server";

import {
  getCashFlowSummary,
  getDashboardMetricsExtras,
  listClients,
  listLowStockItems,
  listNearLowStockItems,
  type DashboardMetricsExtras,
  type LowStockItem,
  type CashFlowSummary,
} from "@boilerplate/db";
import { requireTenantContext } from "@/lib/tenant-context";

export type DashboardOverview = {
  cashFlow: CashFlowSummary;
  clientCount: number;
  lowStock: LowStockItem[];
  nearLowStock: LowStockItem[];
  metrics: DashboardMetricsExtras;
};

export async function getDashboardOverviewAction(): Promise<DashboardOverview> {
  const { schemaName } = await requireTenantContext();
  const [cashFlow, clients, lowStock, nearLowStock, metrics] = await Promise.all([
    getCashFlowSummary(schemaName),
    listClients(schemaName),
    listLowStockItems(schemaName),
    listNearLowStockItems(schemaName),
    getDashboardMetricsExtras(schemaName),
  ]);
  return {
    cashFlow,
    clientCount: clients.filter((c) => c.active).length,
    lowStock,
    nearLowStock,
    metrics,
  };
}
