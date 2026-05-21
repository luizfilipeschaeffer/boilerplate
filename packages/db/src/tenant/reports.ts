import { prisma } from "../client";
import {
  assertSafeSchemaName,
  tenantCashFlowTable,
  tenantSalesTable,
} from "./schema";

export interface PeriodReport {
  from: string;
  to: string;
  saleCount: number;
  revenueCents: number;
  ticketMedioCents: number;
  canceladas: number;
}

export interface OverduePayable {
  id: string;
  description: string;
  amount_cents: number;
  due_date: Date;
  days_overdue: number;
}

export async function getPeriodReport(
  schemaName: string,
  fromIso: string,
  toIso: string,
): Promise<PeriodReport> {
  assertSafeSchemaName(schemaName);
  const salesTable = tenantSalesTable(schemaName);

  const rows = await prisma.$queryRawUnsafe<
    { status: string; count: bigint; total: bigint }[]
  >(
    `SELECT status, COUNT(*)::bigint AS count, COALESCE(SUM(total_cents), 0)::bigint AS total
     FROM ${salesTable}
     WHERE created_at >= $1::timestamptz AND created_at < ($2::date + INTERVAL '1 day')
     GROUP BY status`,
    fromIso,
    toIso,
  );

  let saleCount = 0;
  let revenueCents = 0;
  let canceladas = 0;

  for (const r of rows) {
    const count = Number(r.count);
    const total = Number(r.total);
    if (r.status === "confirmada") {
      saleCount = count;
      revenueCents = total;
    } else if (r.status === "cancelada") {
      canceladas = count;
    }
  }

  const ticketMedioCents =
    saleCount > 0 ? Math.round(revenueCents / saleCount) : 0;

  return {
    from: fromIso,
    to: toIso,
    saleCount,
    revenueCents,
    ticketMedioCents,
    canceladas,
  };
}

export async function listOverduePayables(
  schemaName: string,
): Promise<OverduePayable[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantCashFlowTable(schemaName);

  return prisma.$queryRawUnsafe<OverduePayable[]>(
    `SELECT id, description, amount_cents, due_date,
            GREATEST(0, (CURRENT_DATE - due_date))::int AS days_overdue
     FROM ${table}
     WHERE entry_type = 'saida' AND status = 'previsto' AND due_date < CURRENT_DATE
     ORDER BY due_date ASC
     LIMIT 50`,
  );
}
