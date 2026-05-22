import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { assertSafeSchemaName, tenantPaymentMethodsTable } from "./schema";

export interface PaymentMethodRow {
  id: string;
  code: string;
  label: string;
  active: boolean;
  sort_order: number;
}

export async function listPaymentMethods(
  schemaName: string,
  activeOnly = false,
): Promise<PaymentMethodRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantPaymentMethodsTable(schemaName);
  const where = activeOnly ? "WHERE active = true" : "";
  return prisma.$queryRawUnsafe<PaymentMethodRow[]>(
    `SELECT id, code, label, active, sort_order
     FROM ${table}
     ${where}
     ORDER BY sort_order ASC, label ASC`,
  );
}

export async function createPaymentMethod(
  schemaName: string,
  input: { code: string; label: string; sortOrder?: number },
): Promise<PaymentMethodRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantPaymentMethodsTable(schemaName);
  const id = randomUUID();
  const code = input.code.trim().toLowerCase().replace(/\s+/g, "_");
  const label = input.label.trim();
  if (!code || !label) throw new Error("Código e nome são obrigatórios");

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (id, code, label, active, sort_order)
     VALUES ($1, $2, $3, true, $4)`,
    id,
    code,
    label,
    input.sortOrder ?? 99,
  );

  const rows = await prisma.$queryRawUnsafe<PaymentMethodRow[]>(
    `SELECT id, code, label, active, sort_order FROM ${table} WHERE id = $1`,
    id,
  );
  return rows[0]!;
}

export async function updatePaymentMethod(
  schemaName: string,
  id: string,
  input: { label?: string; active?: boolean; sortOrder?: number },
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantPaymentMethodsTable(schemaName);
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (input.label !== undefined) {
    sets.push(`label = $${i++}`);
    params.push(input.label.trim());
  }
  if (input.active !== undefined) {
    sets.push(`active = $${i++}`);
    params.push(input.active);
  }
  if (input.sortOrder !== undefined) {
    sets.push(`sort_order = $${i++}`);
    params.push(input.sortOrder);
  }
  if (sets.length === 0) return;
  params.push(id);
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${i}`,
    ...params,
  );
}
