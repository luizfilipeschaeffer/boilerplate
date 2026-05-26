import { randomUUID } from "node:crypto";
import type { HelpdeskCsatInput } from "@boilerplate/crm-helpdesk";
import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";

export async function submitHelpdeskCsat(
  schemaName: string,
  input: HelpdeskCsatInput,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = `"${schemaName}"."crm_helpdesk_csat_responses"`;
  const score = Math.min(5, Math.max(1, Math.round(input.score)));
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (id, ticket_id, score, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (ticket_id) DO UPDATE SET score = $3, comment = $4`,
    randomUUID(),
    input.ticketId,
    score,
    input.comment?.trim() ?? null,
  );
}

export async function getHelpdeskCsatAverage(
  schemaName: string,
): Promise<number | null> {
  assertSafeSchemaName(schemaName);
  const table = `"${schemaName}"."crm_helpdesk_csat_responses"`;
  const rows = await prisma.$queryRawUnsafe<{ avg: number | null }[]>(
    `SELECT AVG(score)::float AS avg FROM ${table}`,
  );
  const avg = rows[0]?.avg;
  return avg == null ? null : Math.round(avg * 10) / 10;
}
