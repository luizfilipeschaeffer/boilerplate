import { randomUUID } from "node:crypto";
import type {
  CreateKbArticleInput,
  CreateKbThreadInput,
  HelpdeskKbEntryDetail,
  HelpdeskKbEntrySummary,
  HelpdeskKbPost,
  HelpdeskKbSolution,
} from "@boilerplate/crm-helpdesk";
import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";
import { ensureTenantHelpdeskTables } from "./ensure-tables";
import { reindexHelpdeskKbEntry } from "./kb-search";

function kbTable(schema: string): string {
  return `"${schema}"."crm_helpdesk_kb_entries"`;
}
function postsTable(schema: string): string {
  return `"${schema}"."crm_helpdesk_kb_posts"`;
}

export async function listHelpdeskKbEntries(
  schemaName: string,
  status?: "draft" | "published" | "archived",
): Promise<HelpdeskKbEntrySummary[]> {
  await ensureTenantHelpdeskTables(schemaName);
  const table = kbTable(schemaName);
  const posts = postsTable(schemaName);

  const filter = status ? `WHERE e.status = $1` : "";
  const params = status ? [status] : [];

  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      kind: string;
      title: string;
      status: string;
      tags: unknown;
      sector_ids: unknown;
      solutions: unknown;
      updated_at: Date;
      accepted_count: bigint;
    }[]
  >(
    `SELECT e.id, e.kind, e.title, e.status, e.tags, e.sector_ids, e.solutions, e.updated_at,
            COALESCE(
              (SELECT COUNT(*)::bigint FROM ${posts} p
               WHERE p.kb_entry_id = e.id AND p.is_accepted_solution = true),
              0
            ) AS accepted_count
     FROM ${table} e
     ${filter}
     ORDER BY e.updated_at DESC`,
    ...params,
  );

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as "article" | "thread",
    title: r.title,
    status: r.status as HelpdeskKbEntrySummary["status"],
    tags: parseJsonArray(r.tags),
    sectorIds: parseJsonArray(r.sector_ids),
    updatedAt: r.updated_at.toISOString(),
    hasAcceptedSolution:
      r.kind === "article"
        ? parseSolutions(r).length > 0
        : Number(r.accepted_count) > 0,
  }));
}

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function parseSolutions(row: { solutions: unknown }): HelpdeskKbSolution[] {
  if (!Array.isArray(row.solutions)) return [];
  return row.solutions as HelpdeskKbSolution[];
}

export async function getHelpdeskKbEntry(
  schemaName: string,
  organizationId: string,
  kbEntryId: string,
): Promise<HelpdeskKbEntryDetail | null> {
  await ensureTenantHelpdeskTables(schemaName);
  const table = kbTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      kind: string;
      title: string;
      problem_body: string;
      status: string;
      solutions: unknown;
      tags: unknown;
      sector_ids: unknown;
      updated_at: Date;
    }[]
  >(`SELECT * FROM ${table} WHERE id = $1`, kbEntryId);
  const row = rows[0];
  if (!row) return null;

  const posts =
    row.kind === "thread"
      ? await listKbPosts(schemaName, kbEntryId, organizationId)
      : [];

  const summary = (await listHelpdeskKbEntries(schemaName)).find(
    (e) => e.id === kbEntryId,
  );

  return {
    id: row.id,
    kind: row.kind as "article" | "thread",
    title: row.title,
    status: row.status as HelpdeskKbEntryDetail["status"],
    tags: parseJsonArray(row.tags),
    sectorIds: parseJsonArray(row.sector_ids),
    updatedAt: row.updated_at.toISOString(),
    hasAcceptedSolution: summary?.hasAcceptedSolution ?? false,
    problemBody: row.problem_body,
    solutions: parseSolutions(row),
    posts,
  };
}

async function listKbPosts(
  schemaName: string,
  kbEntryId: string,
  organizationId: string,
): Promise<HelpdeskKbPost[]> {
  const { listOrganizationMembers } = await import("../membership-sectors");
  const labels = new Map(
    (await listOrganizationMembers(organizationId)).map((m) => [
      m.membershipId,
      m.name || m.email,
    ]),
  );
  const table = postsTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      body: string;
      author_membership_id: string | null;
      is_accepted_solution: boolean;
      created_at: Date;
    }[]
  >(
    `SELECT * FROM ${table} WHERE kb_entry_id = $1 ORDER BY created_at ASC`,
    kbEntryId,
  );
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    authorMembershipId: r.author_membership_id,
    authorLabel: r.author_membership_id
      ? labels.get(r.author_membership_id) ?? "—"
      : "—",
    isAcceptedSolution: r.is_accepted_solution,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function createHelpdeskKbArticle(
  schemaName: string,
  input: CreateKbArticleInput & { authorMembershipId?: string | null },
): Promise<string> {
  await ensureTenantHelpdeskTables(schemaName);
  const id = randomUUID();
  const status = input.publish ? "published" : "draft";
  const table = kbTable(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table}
      (id, kind, title, problem_body, status, solutions, tags, sector_ids,
       author_membership_id, published_at)
     VALUES ($1,'article',$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9)`,
    id,
    input.title.trim(),
    input.problemBody.trim(),
    status,
    JSON.stringify(input.solutions ?? []),
    JSON.stringify(input.tags ?? []),
    JSON.stringify(input.sectorIds ?? []),
    input.authorMembershipId ?? null,
    input.publish ? new Date() : null,
  );
  if (input.publish) await reindexHelpdeskKbEntry(schemaName, id);
  return id;
}

export async function createHelpdeskKbThread(
  schemaName: string,
  input: CreateKbThreadInput & { authorMembershipId?: string | null },
): Promise<string> {
  await ensureTenantHelpdeskTables(schemaName);
  const id = randomUUID();
  const status = input.publish ? "published" : "draft";
  const table = kbTable(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table}
      (id, kind, title, problem_body, status, tags, sector_ids,
       author_membership_id, published_at)
     VALUES ($1,'thread',$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)`,
    id,
    input.title.trim(),
    input.problemBody.trim(),
    status,
    JSON.stringify(input.tags ?? []),
    JSON.stringify(input.sectorIds ?? []),
    input.authorMembershipId ?? null,
    input.publish ? new Date() : null,
  );
  if (input.publish) await reindexHelpdeskKbEntry(schemaName, id);
  return id;
}

export async function addKbThreadPost(
  schemaName: string,
  kbEntryId: string,
  input: {
    body: string;
    authorMembershipId?: string | null;
    isAcceptedSolution?: boolean;
  },
): Promise<void> {
  const posts = postsTable(schemaName);
  const kb = kbTable(schemaName);
  if (input.isAcceptedSolution) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${posts} SET is_accepted_solution = false WHERE kb_entry_id = $1`,
      kbEntryId,
    );
  }
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${posts}
      (id, kb_entry_id, body, author_membership_id, is_accepted_solution)
     VALUES ($1, $2, $3, $4, $5)`,
    randomUUID(),
    kbEntryId,
    input.body.trim(),
    input.authorMembershipId ?? null,
    input.isAcceptedSolution ?? false,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${kb} SET updated_at = NOW() WHERE id = $1`,
    kbEntryId,
  );
  const statusRows = await prisma.$queryRawUnsafe<{ status: string }[]>(
    `SELECT status FROM ${kb} WHERE id = $1`,
    kbEntryId,
  );
  if (statusRows[0]?.status === "published") {
    await reindexHelpdeskKbEntry(schemaName, kbEntryId);
  }
}

export async function publishHelpdeskKbEntry(
  schemaName: string,
  kbEntryId: string,
): Promise<void> {
  const table = kbTable(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET status = 'published', published_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    kbEntryId,
  );
  await reindexHelpdeskKbEntry(schemaName, kbEntryId);
}
