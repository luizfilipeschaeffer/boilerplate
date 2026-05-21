"use server";

import { requireTenantContext } from "@/lib/tenant-context";
import {
  createCashFlowEntry,
  getCashFlowSummary,
  listCashFlowEntries,
  markPayablePaid,
  type CashFlowEntryType,
  type CashFlowStatus,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";

export async function getCashFlowDashboardAction() {
  const { schemaName } = await requireTenantContext();
  const [entries, summary] = await Promise.all([
    listCashFlowEntries(schemaName),
    getCashFlowSummary(schemaName),
  ]);
  return { entries, summary };
}

export async function createCashFlowEntryAction(data: {
  entryType: CashFlowEntryType;
  amountReais: string;
  description: string;
  category?: string;
  status?: CashFlowStatus;
  dueDate?: string | null;
}) {
  const { schemaName } = await requireTenantContext();
  const parsed = parseFloat(data.amountReais.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Valor inválido");
  }
  await createCashFlowEntry(schemaName, {
    entryType: data.entryType,
    amountCents: Math.round(parsed * 100),
    description: data.description,
    category: data.category,
    status: data.status,
    dueDate: data.dueDate,
  });
  revalidatePath("/fluxo-caixa");
  revalidatePath("/relatorios");
}

export async function markPayablePaidAction(entryId: string) {
  const { schemaName } = await requireTenantContext();
  await markPayablePaid(schemaName, entryId);
  revalidatePath("/fluxo-caixa");
  revalidatePath("/relatorios");
}
