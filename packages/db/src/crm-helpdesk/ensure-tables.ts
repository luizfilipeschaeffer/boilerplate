import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";

export function helpdeskDdlStatements(schema: string): string[] {
  return [
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_ticket_seq" (
      id TEXT PRIMARY KEY DEFAULT 'default',
      last_number INTEGER NOT NULL DEFAULT 0
    )`,
    `INSERT INTO "${schema}"."crm_helpdesk_ticket_seq" (id, last_number)
     VALUES ('default', 0) ON CONFLICT (id) DO NOTHING`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_sla_policies" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      first_response_minutes JSONB NOT NULL DEFAULT '{}',
      resolution_minutes JSONB NOT NULL DEFAULT '{}',
      business_hours JSONB NOT NULL DEFAULT '{"days":[1,2,3,4,5],"startHour":9,"endHour":18}',
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_queues" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sector_id TEXT,
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_queue_members" (
      queue_id TEXT NOT NULL,
      membership_id TEXT NOT NULL,
      PRIMARY KEY (queue_id, membership_id)
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_tickets" (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      requester_membership_id TEXT,
      affected_sector_id TEXT,
      assignee_membership_id TEXT,
      queue_id TEXT,
      sla_policy_id TEXT,
      sla_due_at TIMESTAMPTZ,
      first_response_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      closed_at TIMESTAMPTZ,
      branch_id TEXT,
      platform_comms_thread_id TEXT,
      created_by_membership_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "crm_helpdesk_tickets_status_idx"
      ON "${schema}"."crm_helpdesk_tickets" (status)`,
    `CREATE INDEX IF NOT EXISTS "crm_helpdesk_tickets_queue_idx"
      ON "${schema}"."crm_helpdesk_tickets" (queue_id)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_ticket_comments" (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      body TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'internal',
      author_membership_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "crm_helpdesk_comments_ticket_idx"
      ON "${schema}"."crm_helpdesk_ticket_comments" (ticket_id)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_kb_entries" (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL DEFAULT 'article',
      title TEXT NOT NULL,
      problem_body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      solutions JSONB NOT NULL DEFAULT '[]',
      tags JSONB NOT NULL DEFAULT '[]',
      sector_ids JSONB NOT NULL DEFAULT '[]',
      author_membership_id TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_kb_posts" (
      id TEXT PRIMARY KEY,
      kb_entry_id TEXT NOT NULL,
      body TEXT NOT NULL,
      author_membership_id TEXT,
      is_accepted_solution BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_ticket_kb_links" (
      ticket_id TEXT NOT NULL,
      kb_entry_id TEXT NOT NULL,
      link_type TEXT NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (ticket_id, kb_entry_id)
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_kb_search_chunks" (
      id TEXT PRIMARY KEY,
      kb_entry_id TEXT NOT NULL,
      chunk_text TEXT NOT NULL,
      search_vector TSVECTOR,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "crm_helpdesk_kb_search_idx"
      ON "${schema}"."crm_helpdesk_kb_search_chunks" USING GIN (search_vector)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_csat_responses" (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL UNIQUE,
      score INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_helpdesk_automation_rules" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      action_type TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}',
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];
}

export async function ensureTenantHelpdeskTables(schemaName: string): Promise<void> {
  assertSafeSchemaName(schemaName);
  for (const sql of helpdeskDdlStatements(schemaName)) {
    await prisma.$executeRawUnsafe(sql);
  }
  await seedHelpdeskDefaults(schemaName);
}

async function seedHelpdeskDefaults(schemaName: string): Promise<void> {
  const s = schemaName;
  const policyId = "sla-default";
  const queueId = "queue-ti-default";

  await prisma.$executeRawUnsafe(
    `INSERT INTO "${s}"."crm_helpdesk_sla_policies"
      (id, name, first_response_minutes, resolution_minutes)
     VALUES ($1, $2, $3::jsonb, $4::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    policyId,
    "SLA padrão TI",
    JSON.stringify({ low: 480, medium: 240, high: 120, urgent: 60 }),
    JSON.stringify({ low: 2880, medium: 1440, high: 480, urgent: 240 }),
  );

  await prisma.$executeRawUnsafe(
    `INSERT INTO "${s}"."crm_helpdesk_queues" (id, name, is_default)
     VALUES ($1, $2, true)
     ON CONFLICT (id) DO NOTHING`,
    queueId,
    "Fila TI",
  );

  const automations = [
    {
      id: "auto-route-ti",
      name: "Novos tickets → Fila TI",
      trigger: "ticket.created",
      action: "assign_queue",
      config: { queueId },
    },
    {
      id: "auto-suggest-kb",
      name: "Resolver → sugerir KB",
      trigger: "ticket.resolved",
      action: "suggest_kb_link",
      config: {},
    },
    {
      id: "auto-csat",
      name: "Fechar → solicitar CSAT",
      trigger: "ticket.closed",
      action: "request_csat",
      config: {},
    },
  ];

  for (const rule of automations) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${s}"."crm_helpdesk_automation_rules"
        (id, name, trigger_type, action_type, config)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      rule.id,
      rule.name,
      rule.trigger,
      rule.action,
      JSON.stringify(rule.config),
    );
  }
}
