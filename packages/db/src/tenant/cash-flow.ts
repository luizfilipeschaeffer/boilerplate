import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { assertSafeSchemaName, tenantCashFlowTable } from "./schema";

export type CashFlowEntryType = "entrada" | "saida";
export type CashFlowStatus = "realizado" | "previsto";

export interface CashFlowRow {
  id: string;
  entry_type: CashFlowEntryType;
  amount_cents: number;
  description: string;
  category: string;
  status: CashFlowStatus;
  due_date: Date | null;
  sale_id: string | null;
  created_at: Date;
}

export interface CashFlowSummary {
  entradasRealizadas: number;
  saidasRealizadas: number;
  saldoRealizado: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoProjetado: number;
}

export async function listCashFlowEntries(
  schemaName: string,
  limit = 100,
): Promise<CashFlowRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantCashFlowTable(schemaName);
  return prisma.$queryRawUnsafe<CashFlowRow[]>(
    `SELECT id, entry_type, amount_cents, description, category, status, due_date, sale_id, created_at
     FROM ${table}
     ORDER BY created_at DESC
     LIMIT $1`,
    limit,
  );
}

export async function getCashFlowSummary(
  schemaName: string,
): Promise<CashFlowSummary> {
  assertSafeSchemaName(schemaName);
  const table = tenantCashFlowTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    { entry_type: string; status: string; total: bigint }[]
  >(
    `SELECT entry_type, status, COALESCE(SUM(amount_cents), 0)::bigint AS total
     FROM ${table}
     GROUP BY entry_type, status`,
  );

  let entradasRealizadas = 0;
  let saidasRealizadas = 0;
  let entradasPrevistas = 0;
  let saidasPrevistas = 0;

  for (const r of rows) {
    const total = Number(r.total);
    if (r.entry_type === "entrada") {
      if (r.status === "realizado") entradasRealizadas += total;
      else entradasPrevistas += total;
    } else {
      if (r.status === "realizado") saidasRealizadas += total;
      else saidasPrevistas += total;
    }
  }

  const saldoRealizado = entradasRealizadas - saidasRealizadas;
  const saldoProjetado =
    entradasRealizadas +
    entradasPrevistas -
    (saidasRealizadas + saidasPrevistas);

  return {
    entradasRealizadas,
    saidasRealizadas,
    saldoRealizado,
    entradasPrevistas,
    saidasPrevistas,
    saldoProjetado,
  };
}

export async function createCashFlowEntry(
  schemaName: string,
  input: {
    entryType: CashFlowEntryType;
    amountCents: number;
    description: string;
    category?: string;
    status?: CashFlowStatus;
    dueDate?: string | null;
    saleId?: string | null;
  },
): Promise<CashFlowRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantCashFlowTable(schemaName);
  const id = randomUUID();
  const amount = Math.max(0, Math.floor(input.amountCents));
  if (amount <= 0) throw new Error("Informe um valor maior que zero");

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table}
      (id, entry_type, amount_cents, description, category, status, due_date, sale_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)`,
    id,
    input.entryType,
    amount,
    input.description.trim(),
    input.category ?? (input.entryType === "entrada" ? "receita" : "despesa"),
    input.status ?? "realizado",
    input.dueDate ?? null,
    input.saleId ?? null,
  );

  const rows = await prisma.$queryRawUnsafe<CashFlowRow[]>(
    `SELECT id, entry_type, amount_cents, description, category, status, due_date, sale_id, created_at
     FROM ${table} WHERE id = $1`,
    id,
  );
  return rows[0]!;
}

/** Registra entrada automática ao confirmar venda (Fase 2). */
export async function recordSaleCashInflow(
  schemaName: string,
  saleId: string,
  amountCents: number,
): Promise<void> {
  if (amountCents <= 0) return;
  await createCashFlowEntry(schemaName, {
    entryType: "entrada",
    amountCents,
    description: `Venda confirmada`,
    category: "vendas",
    status: "realizado",
    saleId,
  });
}

export async function markPayablePaid(
  schemaName: string,
  entryId: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantCashFlowTable(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET status = 'realizado' WHERE id = $1 AND entry_type = 'saida'`,
    entryId,
  );
}
