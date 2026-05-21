"use server";

import { requireTenantContext } from "@/lib/tenant-context";
import {
  getPeriodReport,
  listOverduePayables,
} from "@boilerplate/db";

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

export async function getBasicReportAction(from?: string, to?: string) {
  const { schemaName } = await requireTenantContext();
  const range = from && to ? { from, to } : defaultRange();
  const [period, overdue] = await Promise.all([
    getPeriodReport(schemaName, range.from, range.to),
    listOverduePayables(schemaName),
  ]);
  return { period, overdue, range };
}
