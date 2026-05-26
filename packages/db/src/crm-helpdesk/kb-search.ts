import { randomUUID } from "node:crypto";
import type { HelpdeskKbSearchHit } from "@boilerplate/crm-helpdesk";
import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";

function chunkTable(schema: string): string {
  return `"${schema}"."crm_helpdesk_kb_search_chunks"`;
}

function kbTable(schema: string): string {
  return `"${schema}"."crm_helpdesk_kb_entries"`;
}

export async function reindexHelpdeskKbEntry(
  schemaName: string,
  kbEntryId: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const kb = kbTable(schemaName);
  const chunks = chunkTable(schemaName);

  const rows = await prisma.$queryRawUnsafe<
    {
      title: string;
      problem_body: string;
      solutions: unknown;
      status: string;
    }[]
  >(
    `SELECT title, problem_body, solutions, status FROM ${kb} WHERE id = $1`,
    kbEntryId,
  );
  const entry = rows[0];
  if (!entry || entry.status !== "published") {
    await prisma.$executeRawUnsafe(
      `DELETE FROM ${chunks} WHERE kb_entry_id = $1`,
      kbEntryId,
    );
    return;
  }

  const parts: string[] = [entry.title, entry.problem_body];
  const solutions = Array.isArray(entry.solutions) ? entry.solutions : [];
  for (const sol of solutions) {
    if (sol && typeof sol === "object") {
      const s = sol as { title?: string; body?: string };
      if (s.title) parts.push(s.title);
      if (s.body) parts.push(s.body);
    }
  }

  const chunkText = parts.join("\n\n").slice(0, 12_000);
  const chunkId = randomUUID();

  await prisma.$executeRawUnsafe(
    `DELETE FROM ${chunks} WHERE kb_entry_id = $1`,
    kbEntryId,
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${chunks} (id, kb_entry_id, chunk_text, search_vector, updated_at)
     VALUES ($1, $2, $3, to_tsvector('portuguese', $3), NOW())`,
    chunkId,
    kbEntryId,
    chunkText,
  );
}

export async function searchHelpdeskKb(
  schemaName: string,
  query: string,
  opts?: { limit?: number; sectorId?: string | null },
): Promise<HelpdeskKbSearchHit[]> {
  assertSafeSchemaName(schemaName);
  const q = query.trim();
  if (!q) return [];

  const limit = opts?.limit ?? 8;
  const chunks = chunkTable(schemaName);
  const kb = kbTable(schemaName);

  const sectorFilter = opts?.sectorId
    ? `AND (e.sector_ids = '[]'::jsonb OR e.sector_ids ? $3)`
    : "";
  const params: unknown[] = [q, limit];
  if (opts?.sectorId) params.push(opts.sectorId);

  const rows = await prisma.$queryRawUnsafe<
    {
      kb_entry_id: string;
      title: string;
      snippet: string;
      rank: number;
    }[]
  >(
    `SELECT c.kb_entry_id, e.title,
            ts_headline('portuguese', c.chunk_text, plainto_tsquery('portuguese', $1)) AS snippet,
            ts_rank(c.search_vector, plainto_tsquery('portuguese', $1)) AS rank
     FROM ${chunks} c
     JOIN ${kb} e ON e.id = c.kb_entry_id
     WHERE e.status = 'published'
       AND c.search_vector @@ plainto_tsquery('portuguese', $1)
       ${sectorFilter}
     ORDER BY rank DESC
     LIMIT $2`,
    ...params,
  );

  return rows.map((r) => ({
    kbEntryId: r.kb_entry_id,
    title: r.title,
    snippet: r.snippet,
    score: Number(r.rank) || 0,
  }));
}
