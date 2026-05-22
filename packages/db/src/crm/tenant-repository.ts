import { randomUUID } from "node:crypto";
import type {
  CrmBoardRecord,
  CrmNote,
  CrmRecordKind,
  CrmRepository,
  CreateDealInput,
  CreateLeadInput,
} from "@boilerplate/crm";
import {
  asTenantPipelineStage,
  tenantStageAsBoardStage,
  type TenantCrmPipelineStage,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import { prisma } from "../client";
import { assertSafeSchemaName, tenantClientsTable } from "../tenant/schema";
import {
  ensureTenantCrmLeadExtensions,
  insertTenantLead,
} from "./tenant-leads";

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  estimated_phase: number | null;
  source: string | null;
  owner_user_id: string | null;
  lead_status: string | null;
  created_at: Date;
};

type DealRow = {
  id: string;
  client_id: string | null;
  crm_lead_id: string | null;
  pipeline_stage: string;
  phase: number;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  created_at: Date;
};

type NoteRow = {
  id: string;
  body: string;
  created_at: Date;
};

function leadToRecord(row: LeadRow): CrmBoardRecord {
  const stage = asTenantPipelineStage(row.pipeline_stage);
  return {
    id: row.id,
    kind: "lead",
    title: row.name,
    subtitle: row.email ?? undefined,
    phase: 1 as Fase,
    pipelineStage: tenantStageAsBoardStage(stage),
    moduleIds: [],
    meta: {
      email: row.email,
      phone: row.phone,
      source: row.source,
      ownerUserId: row.owner_user_id,
      leadStatus: row.lead_status,
      createdAt: row.created_at.toISOString(),
    },
  };
}

function dealToRecord(row: DealRow): CrmBoardRecord {
  const stage = asTenantPipelineStage(row.pipeline_stage);
  return {
    id: row.id,
    kind: "organization",
    title: row.client_name ?? "Oportunidade",
    subtitle: row.client_email ?? undefined,
    phase: 1 as Fase,
    pipelineStage: tenantStageAsBoardStage(stage),
    moduleIds: ["core-clientes"],
    meta: {
      clientId: row.client_id,
      email: row.client_email,
      phone: row.client_phone,
      crmLeadId: row.crm_lead_id,
      createdAt: row.created_at.toISOString(),
    },
  };
}

function table(schemaName: string, name: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."${name}"`;
}

async function insertTenantCrmActivity(
  schemaName: string,
  recordId: string,
  kind: CrmRecordKind,
  input: { activityType: string; body: string },
): Promise<void> {
  const activityTable = table(schemaName, "crm_activity");
  const dealTable = table(schemaName, "crm_deal");
  const id = randomUUID();

  if (kind === "lead") {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${activityTable} (id, activity_type, body, crm_lead_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      id,
      input.activityType,
      input.body,
      recordId,
    );
  } else {
    const deals = await prisma.$queryRawUnsafe<{ client_id: string | null }[]>(
      `SELECT client_id FROM ${dealTable} WHERE id = $1 LIMIT 1`,
      recordId,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${activityTable} (id, activity_type, body, client_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      id,
      input.activityType,
      input.body,
      deals[0]?.client_id ?? null,
    );
  }
}

export function createTenantCrmRepository(schemaName: string): CrmRepository {
  const leadTable = table(schemaName, "crm_lead");
  const dealTable = table(schemaName, "crm_deal");
  const noteTable = table(schemaName, "crm_note");
  const clientsTable = tenantClientsTable(schemaName);

  return {
    context: "tenant",

    async listBoardRecords(): Promise<CrmBoardRecord[]> {
      await ensureTenantCrmTables(schemaName);
      const leads = await prisma.$queryRawUnsafe<LeadRow[]>(
        `SELECT id, name, email, phone, pipeline_stage, estimated_phase,
                source, owner_user_id, lead_status, created_at
         FROM ${leadTable}
         ORDER BY created_at DESC`,
      );
      const deals = await prisma.$queryRawUnsafe<DealRow[]>(
        `SELECT d.id, d.client_id, d.crm_lead_id, d.pipeline_stage, d.phase,
                c.name AS client_name, c.email AS client_email, c.phone AS client_phone,
                d.created_at
         FROM ${dealTable} d
         LEFT JOIN ${clientsTable} c ON c.id = d.client_id
         ORDER BY d.created_at DESC`,
      );
      return [...leads.map(leadToRecord), ...deals.map(dealToRecord)];
    },

    async updatePhase(): Promise<void> {
      throw new Error("core-crm: fase P1–P4 não disponível no CRM comercial");
    },

    async updatePipelineStage(
      id: string,
      kind: CrmRecordKind,
      stage: import("@boilerplate/crm").CrmPipelineStage,
      previousStage?: string,
    ): Promise<void> {
      const pipelineStage = asTenantPipelineStage(stage);
      if (kind === "lead") {
        await prisma.$executeRawUnsafe(
          `UPDATE ${leadTable}
           SET pipeline_stage = $1, updated_at = NOW()
           WHERE id = $2`,
          pipelineStage,
          id,
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE ${dealTable}
           SET pipeline_stage = $1, updated_at = NOW()
           WHERE id = $2`,
          pipelineStage,
          id,
        );
      }
      const fromLabel = previousStage ?? "—";
      await insertTenantCrmActivity(schemaName, id, kind, {
        activityType: "stage_change",
        body: `${fromLabel} → ${pipelineStage}`,
      });
    },

    async listNotes(id: string, kind: CrmRecordKind): Promise<CrmNote[]> {
      const rows = await prisma.$queryRawUnsafe<NoteRow[]>(
        `SELECT id, body, created_at
         FROM ${noteTable}
         WHERE ${kind === "lead" ? "crm_lead_id = $1" : "organization_ref = $1"}
         ORDER BY created_at DESC
         LIMIT 50`,
        id,
      );

      return rows.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.created_at,
        authorName: null,
      }));
    },

    async addNote(
      id: string,
      kind: CrmRecordKind,
      body: string,
    ): Promise<void> {
      const noteId = randomUUID();
      if (kind === "lead") {
        await prisma.$executeRawUnsafe(
          `INSERT INTO ${noteTable} (id, body, crm_lead_id, created_at)
           VALUES ($1, $2, $3, NOW())`,
          noteId,
          body,
          id,
        );
      } else {
        const deals = await prisma.$queryRawUnsafe<{ client_id: string | null }[]>(
          `SELECT client_id FROM ${dealTable} WHERE id = $1 LIMIT 1`,
          id,
        );
        const clientId = deals[0]?.client_id ?? null;
        await prisma.$executeRawUnsafe(
          `INSERT INTO ${noteTable} (id, body, organization_ref, client_id, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          noteId,
          body,
          id,
          clientId,
        );
      }
    },

    async createLead(input: CreateLeadInput): Promise<CrmBoardRecord> {
      const id = await insertTenantLead(schemaName, {
        name: input.name,
        email: input.email,
        phone: input.phone,
        cnpj: input.cnpj,
        source: input.source,
        ownerUserId: input.ownerUserId,
        notes: input.notes,
        tags: input.tags,
        utm: input.utm,
      });
      const rows = await prisma.$queryRawUnsafe<LeadRow[]>(
        `SELECT id, name, email, phone, pipeline_stage, estimated_phase,
                source, owner_user_id, lead_status, created_at
         FROM ${leadTable} WHERE id = $1`,
        id,
      );
      return leadToRecord(rows[0]!);
    },

    async createDeal(input: CreateDealInput): Promise<CrmBoardRecord> {
      const clients = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM ${clientsTable} WHERE id = $1 LIMIT 1`,
        input.clientId,
      );
      if (!clients[0]) {
        throw new Error("Cliente não encontrado");
      }

      const id = randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO ${dealTable} (id, client_id, crm_lead_id, phase, pipeline_stage)
         VALUES ($1, $2, $3, 1, 'qualificado')`,
        id,
        input.clientId,
        input.crmLeadId ?? null,
      );
      const withClient = await prisma.$queryRawUnsafe<DealRow[]>(
        `SELECT d.id, d.client_id, d.crm_lead_id, d.pipeline_stage, d.phase,
                c.name AS client_name, c.email AS client_email, c.phone AS client_phone,
                d.created_at
         FROM ${dealTable} d
         LEFT JOIN ${clientsTable} c ON c.id = d.client_id
         WHERE d.id = $1`,
        id,
      );
      return dealToRecord(withClient[0]!);
    },
  };
}

export async function ensureTenantCrmTables(schemaName: string): Promise<void> {
  assertSafeSchemaName(schemaName);
  const s = schemaName;
  await ensureTenantCrmLeadExtensions(schemaName);
  const statements = [
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_lead" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      pipeline_stage TEXT NOT NULL DEFAULT 'prospect',
      estimated_phase INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_deal" (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      crm_lead_id TEXT,
      phase INTEGER NOT NULL DEFAULT 1,
      pipeline_stage TEXT NOT NULL DEFAULT 'qualificado',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_note" (
      id TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      organization_ref TEXT,
      client_id TEXT,
      crm_lead_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_activity" (
      id TEXT PRIMARY KEY,
      activity_type TEXT NOT NULL,
      body TEXT,
      client_id TEXT,
      crm_lead_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE "${s}"."crm_activity" ADD COLUMN IF NOT EXISTS crm_lead_id TEXT`,
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}
