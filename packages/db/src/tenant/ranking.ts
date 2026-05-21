import { prisma } from "../client";
import { assertSafeSchemaName } from "./schema";

export interface TopItemRow {
  catalog_item_id: string;
  name: string;
  total_qty: number;
  total_cents: number;
}

export interface TopClientRow {
  client_id: string;
  name: string;
  sale_count: number;
  total_cents: number;
}

export async function getTopItems(
  schemaName: string,
  limit = 10,
): Promise<TopItemRow[]> {
  assertSafeSchemaName(schemaName);
  const schema = schemaName;
  return prisma.$queryRawUnsafe<TopItemRow[]>(
    `SELECT si.catalog_item_id, ci.name,
            SUM(si.quantity)::int AS total_qty,
            SUM(si.line_total_cents)::int AS total_cents
     FROM "${schema}"."sale_items" si
     JOIN "${schema}"."sales" s ON s.id = si.sale_id AND s.status = 'confirmada'
     JOIN "${schema}"."catalog_items" ci ON ci.id = si.catalog_item_id
     GROUP BY si.catalog_item_id, ci.name
     ORDER BY total_qty DESC
     LIMIT $1`,
    limit,
  );
}

export async function getTopClients(
  schemaName: string,
  limit = 10,
): Promise<TopClientRow[]> {
  assertSafeSchemaName(schemaName);
  const schema = schemaName;
  return prisma.$queryRawUnsafe<TopClientRow[]>(
    `SELECT c.id AS client_id, c.name,
            COUNT(s.id)::int AS sale_count,
            COALESCE(SUM(s.total_cents), 0)::int AS total_cents
     FROM "${schema}"."sales" s
     JOIN "${schema}"."clients" c ON c.id = s.client_id
     WHERE s.status = 'confirmada'
     GROUP BY c.id, c.name
     ORDER BY total_cents DESC
     LIMIT $1`,
    limit,
  );
}
