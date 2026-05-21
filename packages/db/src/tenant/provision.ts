import { prisma } from "../client";
import { assertSafeSchemaName } from "./schema";

function tenantDdlStatements(schema: string): string[] {
  return [
    `CREATE SCHEMA IF NOT EXISTS "${schema}"`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."catalog_items" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'produto',
      sku TEXT,
      price_cents INTEGER,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      stock_min INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."clients" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."sales" (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      status TEXT NOT NULL DEFAULT 'confirmada',
      payment_method TEXT NOT NULL DEFAULT 'dinheiro',
      total_cents INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."sale_items" (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      catalog_item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."stock_movements" (
      id TEXT PRIMARY KEY,
      catalog_item_id TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."aprendiz_automacoes" (
      template_id TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."aprendiz_perfil" (
      id TEXT PRIMARY KEY DEFAULT 'principal',
      owner_name TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      negocio_nome TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}',
      primeiro_contato_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."aprendiz_messages" (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."missoes" (
      mission_id TEXT PRIMARY KEY,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT NOT NULL DEFAULT 'auto'
    )`,
  ];
}

/** Colunas e tabelas adicionadas após tenants já provisionados. */
function tenantMigrateStatements(schema: string): string[] {
  return [
    `ALTER TABLE "${schema}"."clients" ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "${schema}"."catalog_items" ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "${schema}"."catalog_items" ADD COLUMN IF NOT EXISTS stock_qty INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "${schema}"."catalog_items" ADD COLUMN IF NOT EXISTS stock_min INTEGER NOT NULL DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."aprendiz_perfil" (
      id TEXT PRIMARY KEY DEFAULT 'principal',
      owner_name TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      negocio_nome TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}',
      primeiro_contato_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."aprendiz_messages" (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."missoes" (
      mission_id TEXT PRIMARY KEY,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT NOT NULL DEFAULT 'auto'
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_lead" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      pipeline_stage TEXT NOT NULL DEFAULT 'lead',
      estimated_phase INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_deal" (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      crm_lead_id TEXT,
      phase INTEGER NOT NULL DEFAULT 1,
      pipeline_stage TEXT NOT NULL DEFAULT 'trial',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_note" (
      id TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      organization_ref TEXT,
      client_id TEXT,
      crm_lead_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_activity" (
      id TEXT PRIMARY KEY,
      activity_type TEXT NOT NULL,
      body TEXT,
      client_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."cash_flow_entries" (
      id TEXT PRIMARY KEY,
      entry_type TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'geral',
      status TEXT NOT NULL DEFAULT 'realizado',
      due_date DATE,
      sale_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."sellers" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      commission_rate_bp INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE "${schema}"."sales" ADD COLUMN IF NOT EXISTS seller_id TEXT`,
  ];
}

async function runStatements(statements: string[]): Promise<void> {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}

export async function provisionTenantSchema(schemaName: string): Promise<void> {
  assertSafeSchemaName(schemaName);
  await runStatements(tenantDdlStatements(schemaName));
  await runStatements(tenantMigrateStatements(schemaName));
}
