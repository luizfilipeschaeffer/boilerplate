import type {
  CrmBoardRecord,
  CrmNote,
  CrmPipelineStage,
  CrmRepository,
  CreateLeadInput,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import { listClients } from "../tenant/clients";

/**
 * Repositório tenant (scaffold): expõe clientes como cards simplificados
 * até migrations CRM no schema do tenant estarem ativas.
 */
export function createTenantCrmRepository(schemaName: string): CrmRepository {
  return {
    context: "tenant",

    async listBoardRecords(): Promise<CrmBoardRecord[]> {
      const clients = await listClients(schemaName);
      return clients.map((c) => ({
        id: c.id,
        kind: "organization" as const,
        title: c.name,
        subtitle: c.email ?? undefined,
        phase: 1 as Fase,
        pipelineStage: "active" as CrmPipelineStage,
        moduleIds: ["core-clientes"],
        meta: {
          email: c.email,
          phone: c.phone,
          active: c.active,
        },
      }));
    },

    async updatePhase(): Promise<void> {
      throw new Error("core-crm: atualização de fase ainda não implementada no tenant");
    },

    async updatePipelineStage(): Promise<void> {
      throw new Error("core-crm: pipeline ainda não implementada no tenant");
    },

    async listNotes(): Promise<CrmNote[]> {
      return [];
    },

    async addNote(): Promise<void> {
      throw new Error("core-crm: notas ainda não implementadas no tenant");
    },

    async createLead(_input: CreateLeadInput): Promise<CrmBoardRecord> {
      throw new Error("core-crm: leads ainda não implementados no tenant");
    },
  };
}

export async function ensureTenantCrmTables(schemaName: string): Promise<void> {
  const { prisma } = await import("../client");
  const { assertSafeSchemaName } = await import("../tenant/schema");
  assertSafeSchemaName(schemaName);
  const s = schemaName;
  const statements = [
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_lead" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      pipeline_stage TEXT NOT NULL DEFAULT 'lead',
      estimated_phase INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${s}"."crm_deal" (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      crm_lead_id TEXT,
      phase INTEGER NOT NULL DEFAULT 1,
      pipeline_stage TEXT NOT NULL DEFAULT 'trial',
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}
