import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import {
  assertSafeSchemaName,
  tenantAprendizMessagesTable,
} from "./schema";

export type AprendizMessageRole = "aprendiz" | "user";

export type AprendizMessageRow = {
  id: string;
  role: AprendizMessageRole;
  content: string;
  meta: Record<string, unknown> | null;
  created_at: Date;
};

export async function countAprendizMessages(schemaName: string): Promise<number> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizMessagesTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*)::bigint AS count FROM ${table}`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function listAprendizMessages(
  schemaName: string,
): Promise<AprendizMessageRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizMessagesTable(schemaName);
  return prisma.$queryRawUnsafe<AprendizMessageRow[]>(
    `SELECT id, role, content, meta, created_at
     FROM ${table}
     ORDER BY created_at ASC`,
  );
}

export async function appendAprendizMessage(
  schemaName: string,
  data: {
    role: AprendizMessageRole;
    content: string;
    meta?: Record<string, unknown> | null;
  },
): Promise<AprendizMessageRow> {
  assertSafeSchemaName(schemaName);
  const id = randomUUID();
  const table = tenantAprendizMessagesTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<AprendizMessageRow[]>(
    `INSERT INTO ${table} (id, role, content, meta)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, role, content, meta, created_at`,
    id,
    data.role,
    data.content,
    data.meta ? JSON.stringify(data.meta) : null,
  );
  return rows[0]!;
}

export async function appendAprendizMessages(
  schemaName: string,
  messages: {
    role: AprendizMessageRole;
    content: string;
    meta?: Record<string, unknown> | null;
  }[],
): Promise<void> {
  for (const msg of messages) {
    await appendAprendizMessage(schemaName, msg);
  }
}
