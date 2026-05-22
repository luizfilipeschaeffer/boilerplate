import { randomUUID } from "node:crypto";
import type {
  CrmLeadDetail,
  CrmLeadDuplicate,
  CrmLeadStatus,
  UpdateLeadInput,
} from "@boilerplate/crm";
import { prisma } from "../client";
import { listOrganizationMembers } from "../membership-sectors";
import { assertSafeSchemaName } from "../tenant/schema";

type LeadRowFull = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  pipeline_stage: string;
  lead_status: string | null;
  source: string | null;
  owner_user_id: string | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  estimated_phase: number | null;
  created_at: Date;
  updated_at: Date;
};

function leadTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."crm_lead"`;
}

function tagTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."crm_lead_tag"`;
}

export async function ensureTenantCrmLeadExtensions(
  schemaName: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const s = schemaName;
  const alters = [
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS cnpj TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'novo'`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS source TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS owner_user_id TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS utm_source TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS utm_medium TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS utm_campaign TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS utm_term TEXT`,
    `ALTER TABLE "${s}"."crm_lead" ADD COLUMN IF NOT EXISTS utm_content TEXT`,
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_lead_tag" (
      lead_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lead_id, tag)
    )`,
  ];
  for (const sql of alters) {
    await prisma.$executeRawUnsafe(sql);
  }
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function normalizeCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj?.trim()) return null;
  const digits = cnpj.replace(/\D/g, "");
  return digits.length >= 11 ? digits : null;
}

function asLeadStatus(value: string | null): CrmLeadStatus {
  const allowed: CrmLeadStatus[] = [
    "novo",
    "em_contato",
    "qualificado",
    "descartado",
  ];
  return allowed.includes(value as CrmLeadStatus)
    ? (value as CrmLeadStatus)
    : "novo";
}

async function loadLeadTags(
  schemaName: string,
  leadId: string,
): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ tag: string }[]>(
    `SELECT tag FROM ${tagTable(schemaName)} WHERE lead_id = $1 ORDER BY tag ASC`,
    leadId,
  );
  return rows.map((r) => r.tag);
}

async function replaceLeadTags(
  schemaName: string,
  leadId: string,
  tags: string[],
): Promise<void> {
  const unique = [
    ...new Set(tags.map((t) => t.trim()).filter(Boolean)),
  ].slice(0, 20);
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${tagTable(schemaName)} WHERE lead_id = $1`,
    leadId,
  );
  for (const tag of unique) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${tagTable(schemaName)} (lead_id, tag) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      leadId,
      tag,
    );
  }
}

export async function getTenantLeadDetail(
  schemaName: string,
  organizationId: string,
  leadId: string,
): Promise<CrmLeadDetail | null> {
  await ensureTenantCrmLeadExtensions(schemaName);
  const rows = await prisma.$queryRawUnsafe<LeadRowFull[]>(
    `SELECT id, name, email, phone, cnpj, pipeline_stage, lead_status, source,
            owner_user_id, notes, utm_source, utm_medium, utm_campaign, utm_term,
            utm_content, estimated_phase, created_at, updated_at
     FROM ${leadTable(schemaName)} WHERE id = $1 LIMIT 1`,
    leadId,
  );
  const row = rows[0];
  if (!row) return null;

  const members = await listOrganizationMembers(organizationId);
  const owner = row.owner_user_id
    ? members.find((m) => m.userId === row.owner_user_id)
    : null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    cnpj: row.cnpj,
    pipelineStage: row.pipeline_stage,
    status: asLeadStatus(row.lead_status),
    source: row.source,
    ownerUserId: row.owner_user_id,
    ownerName: owner?.name ?? owner?.email ?? null,
    notes: row.notes,
    tags: await loadLeadTags(schemaName, leadId),
    utm: {
      source: row.utm_source,
      medium: row.utm_medium,
      campaign: row.utm_campaign,
      term: row.utm_term,
      content: row.utm_content,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateTenantLead(
  schemaName: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<void> {
  await ensureTenantCrmLeadExtensions(schemaName);
  const check = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${leadTable(schemaName)} WHERE id = $1`,
    leadId,
  );
  if (!check[0]) throw new Error("Lead não encontrado");

  if (input.name !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET name = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.name,
    );
  }
  if (input.email !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET email = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.email,
    );
  }
  if (input.phone !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET phone = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.phone,
    );
  }
  if (input.cnpj !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET cnpj = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      normalizeCnpj(input.cnpj),
    );
  }
  if (input.status !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET lead_status = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.status,
    );
  }
  if (input.source !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET source = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.source,
    );
  }
  if (input.ownerUserId !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET owner_user_id = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.ownerUserId,
    );
  }
  if (input.notes !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${leadTable(schemaName)} SET notes = $2, updated_at = NOW() WHERE id = $1`,
      leadId,
      input.notes,
    );
  }
  if (input.utm) {
    const u = input.utm;
    if (u.source !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${leadTable(schemaName)} SET utm_source = $2, updated_at = NOW() WHERE id = $1`,
        leadId,
        u.source,
      );
    }
    if (u.medium !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${leadTable(schemaName)} SET utm_medium = $2, updated_at = NOW() WHERE id = $1`,
        leadId,
        u.medium,
      );
    }
    if (u.campaign !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${leadTable(schemaName)} SET utm_campaign = $2, updated_at = NOW() WHERE id = $1`,
        leadId,
        u.campaign,
      );
    }
    if (u.term !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${leadTable(schemaName)} SET utm_term = $2, updated_at = NOW() WHERE id = $1`,
        leadId,
        u.term,
      );
    }
    if (u.content !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE ${leadTable(schemaName)} SET utm_content = $2, updated_at = NOW() WHERE id = $1`,
        leadId,
        u.content,
      );
    }
  }
  if (input.tags !== undefined) {
    await replaceLeadTags(schemaName, leadId, input.tags);
  }
}

export async function findTenantLeadDuplicates(
  schemaName: string,
  leadId: string,
): Promise<CrmLeadDuplicate[]> {
  await ensureTenantCrmLeadExtensions(schemaName);
  const rows = await prisma.$queryRawUnsafe<LeadRowFull[]>(
    `SELECT id, name, email, phone, cnpj FROM ${leadTable(schemaName)} WHERE id = $1`,
    leadId,
  );
  const lead = rows[0];
  if (!lead) return [];

  const email = normalizeEmail(lead.email);
  const phone = normalizePhone(lead.phone);
  const cnpj = normalizeCnpj(lead.cnpj);
  const found = new Map<string, CrmLeadDuplicate>();

  async function addMatches(
    sql: string,
    params: unknown[],
    reason: CrmLeadDuplicate["matchReason"],
  ) {
    const matches = await prisma.$queryRawUnsafe<
      { id: string; name: string; email: string | null; phone: string | null }[]
    >(sql, ...params);
    for (const m of matches) {
      if (m.id === leadId || found.has(m.id)) continue;
      found.set(m.id, {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        matchReason: reason,
      });
    }
  }

  if (email) {
    await addMatches(
      `SELECT id, name, email, phone FROM ${leadTable(schemaName)}
       WHERE LOWER(TRIM(email)) = $1 AND id <> $2 LIMIT 10`,
      [email, leadId],
      "email",
    );
  }
  if (phone) {
    const all = await prisma.$queryRawUnsafe<
      { id: string; name: string; email: string | null; phone: string | null }[]
    >(
      `SELECT id, name, email, phone FROM ${leadTable(schemaName)} WHERE id <> $1 AND phone IS NOT NULL`,
      leadId,
    );
    for (const m of all) {
      if (normalizePhone(m.phone) === phone && !found.has(m.id)) {
        found.set(m.id, {
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          matchReason: "phone",
        });
      }
    }
  }
  if (cnpj) {
    const all = await prisma.$queryRawUnsafe<
      { id: string; name: string; email: string | null; phone: string | null; cnpj: string | null }[]
    >(
      `SELECT id, name, email, phone, cnpj FROM ${leadTable(schemaName)} WHERE id <> $1 AND cnpj IS NOT NULL`,
      leadId,
    );
    for (const m of all) {
      if (normalizeCnpj(m.cnpj) === cnpj && !found.has(m.id)) {
        found.set(m.id, {
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          matchReason: "cnpj",
        });
      }
    }
  }

  return [...found.values()];
}

export async function mergeTenantLeads(
  schemaName: string,
  targetLeadId: string,
  sourceLeadId: string,
): Promise<void> {
  if (targetLeadId === sourceLeadId) {
    throw new Error("Não é possível mesclar o lead com ele mesmo");
  }
  await ensureTenantCrmLeadExtensions(schemaName);
  const lt = leadTable(schemaName);
  const dealTable = `"${schemaName}"."crm_deal"`;
  const noteTable = `"${schemaName}"."crm_note"`;
  const activityTable = `"${schemaName}"."crm_activity"`;

  const target = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${lt} WHERE id = $1`,
    targetLeadId,
  );
  const source = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${lt} WHERE id = $1`,
    sourceLeadId,
  );
  if (!target[0] || !source[0]) throw new Error("Lead não encontrado");

  const sourceTags = await loadLeadTags(schemaName, sourceLeadId);
  const targetTags = await loadLeadTags(schemaName, targetLeadId);
  await replaceLeadTags(schemaName, targetLeadId, [
    ...targetTags,
    ...sourceTags,
  ]);

  await prisma.$executeRawUnsafe(
    `UPDATE ${noteTable} SET crm_lead_id = $1 WHERE crm_lead_id = $2`,
    targetLeadId,
    sourceLeadId,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${activityTable} SET crm_lead_id = $1 WHERE crm_lead_id = $2`,
    targetLeadId,
    sourceLeadId,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE ${dealTable} SET crm_lead_id = $1 WHERE crm_lead_id = $2`,
    targetLeadId,
    sourceLeadId,
  );
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${tagTable(schemaName)} WHERE lead_id = $1`,
    sourceLeadId,
  );
  await prisma.$executeRawUnsafe(`DELETE FROM ${lt} WHERE id = $1`, sourceLeadId);

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${activityTable} (id, activity_type, body, crm_lead_id, created_at)
     VALUES ($1, 'note', $2, $3, NOW())`,
    randomUUID(),
    `Lead mesclado: ${sourceLeadId} → ${targetLeadId}`,
    targetLeadId,
  );
}

export async function listTenantCrmOwners(
  organizationId: string,
): Promise<{ userId: string; name: string }[]> {
  const members = await listOrganizationMembers(organizationId);
  return members.map((m) => ({
    userId: m.userId,
    name: m.name?.trim() || m.email,
  }));
}

/** Usado no INSERT de lead com campos S05 */
export async function insertTenantLead(
  schemaName: string,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    cnpj?: string | null;
    source?: string | null;
    ownerUserId?: string | null;
    notes?: string | null;
    tags?: string[];
    utm?: {
      source?: string | null;
      medium?: string | null;
      campaign?: string | null;
      term?: string | null;
      content?: string | null;
    };
  },
): Promise<string> {
  await ensureTenantCrmLeadExtensions(schemaName);
  const id = randomUUID();
  const utm = input.utm ?? {};
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${leadTable(schemaName)} (
      id, name, email, phone, cnpj, pipeline_stage, estimated_phase, lead_status,
      source, owner_user_id, notes,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content
    ) VALUES ($1,$2,$3,$4,$5,'prospect',1,'novo',$6,$7,$8,$9,$10,$11,$12,$13)`,
    id,
    input.name,
    input.email ?? null,
    input.phone ?? null,
    normalizeCnpj(input.cnpj),
    input.source ?? null,
    input.ownerUserId ?? null,
    input.notes ?? null,
    utm.source ?? null,
    utm.medium ?? null,
    utm.campaign ?? null,
    utm.term ?? null,
    utm.content ?? null,
  );
  if (input.tags?.length) {
    await replaceLeadTags(schemaName, id, input.tags);
  }
  return id;
}

export async function findDuplicatesForNewLead(
  schemaName: string,
  input: {
    email?: string | null;
    phone?: string | null;
    cnpj?: string | null;
  },
): Promise<CrmLeadDuplicate[]> {
  await ensureTenantCrmLeadExtensions(schemaName);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const cnpj = normalizeCnpj(input.cnpj);
  const found = new Map<string, CrmLeadDuplicate>();
  const lt = leadTable(schemaName);

  if (email) {
    const rows = await prisma.$queryRawUnsafe<
      { id: string; name: string; email: string | null; phone: string | null }[]
    >(
      `SELECT id, name, email, phone FROM ${lt} WHERE LOWER(TRIM(email)) = $1 LIMIT 10`,
      [email],
    );
    for (const m of rows) {
      found.set(m.id, {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        matchReason: "email",
      });
    }
  }
  if (phone) {
    const rows = await prisma.$queryRawUnsafe<
      { id: string; name: string; email: string | null; phone: string | null }[]
    >(`SELECT id, name, email, phone FROM ${lt} WHERE phone IS NOT NULL`);
    for (const m of rows) {
      if (normalizePhone(m.phone) === phone && !found.has(m.id)) {
        found.set(m.id, {
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          matchReason: "phone",
        });
      }
    }
  }
  if (cnpj) {
    const rows = await prisma.$queryRawUnsafe<
      {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        cnpj: string | null;
      }[]
    >(`SELECT id, name, email, phone, cnpj FROM ${lt} WHERE cnpj IS NOT NULL`);
    for (const m of rows) {
      if (normalizeCnpj(m.cnpj) === cnpj && !found.has(m.id)) {
        found.set(m.id, {
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          matchReason: "cnpj",
        });
      }
    }
  }
  return [...found.values()];
}
