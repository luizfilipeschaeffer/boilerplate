import { prisma } from "../client";
import { civilObrasDdlStatements } from "../civil-obras/ensure-tables";
import { helpdeskDdlStatements } from "../crm-helpdesk/ensure-tables";
import { assertSafeSchemaName } from "./schema";

function tenantDdlStatements(schema: string): string[] {
  return [
    `CREATE SCHEMA IF NOT EXISTS "${schema}"`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."catalog_categories" (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."catalog_items" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'produto',
      sku TEXT,
      price_cents INTEGER,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      stock_min INTEGER NOT NULL DEFAULT 0,
      category_id TEXT,
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
      batch_id TEXT,
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
    `ALTER TABLE "${schema}"."catalog_items" ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'produto'`,
    `ALTER TABLE "${schema}"."catalog_items" ADD COLUMN IF NOT EXISTS sku TEXT`,
    `ALTER TABLE "${schema}"."stock_movements" ADD COLUMN IF NOT EXISTS batch_id TEXT`,
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
      cnpj TEXT,
      lead_status TEXT DEFAULT 'novo',
      source TEXT,
      owner_user_id TEXT,
      notes TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_term TEXT,
      utm_content TEXT,
      pipeline_stage TEXT NOT NULL DEFAULT 'prospect',
      estimated_phase INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_lead_tag" (
      lead_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (lead_id, tag)
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."crm_deal" (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      crm_lead_id TEXT,
      phase INTEGER NOT NULL DEFAULT 1,
      pipeline_stage TEXT NOT NULL DEFAULT 'qualificado',
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
      crm_lead_id TEXT,
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
    `ALTER TABLE "${schema}"."sales" ADD COLUMN IF NOT EXISTS branch_id TEXT`,
    `ALTER TABLE "${schema}"."sales" ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE "${schema}"."sales" ADD COLUMN IF NOT EXISTS allowed_payment_methods JSONB`,
    `ALTER TABLE "${schema}"."sales" ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ`,
    `ALTER TABLE "${schema}"."sellers" ADD COLUMN IF NOT EXISTS user_id TEXT`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."payment_methods" (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."catalog_categories" (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE "${schema}"."catalog_items" ADD COLUMN IF NOT EXISTS category_id TEXT`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."suppliers" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT,
      email TEXT,
      phone TEXT,
      lead_time_days INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."supplier_categories" (
      supplier_id TEXT NOT NULL REFERENCES "${schema}"."suppliers"(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES "${schema}"."catalog_categories"(id) ON DELETE CASCADE,
      is_default BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY (supplier_id, category_id)
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."purchase_orders" (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES "${schema}"."suppliers"(id),
      status TEXT NOT NULL DEFAULT 'rascunho',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ,
      received_at TIMESTAMPTZ
    )`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."purchase_order_lines" (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT NOT NULL REFERENCES "${schema}"."purchase_orders"(id) ON DELETE CASCADE,
      catalog_item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_cost_cents INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    ...helpdeskDdlStatements(schema),
    ...civilObrasDdlStatements(schema),
  ];
}

export async function seedDefaultPaymentMethods(schemaName: string): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = `"${schemaName}"."payment_methods"`;
  const defaults = [
    { id: "pm-dinheiro", code: "dinheiro", label: "Dinheiro", sort: 10 },
    { id: "pm-pix", code: "pix", label: "PIX", sort: 20 },
    { id: "pm-cc", code: "cartao_credito", label: "Cartão crédito", sort: 30 },
    { id: "pm-cd", code: "cartao_debito", label: "Cartão débito", sort: 40 },
    { id: "pm-outro", code: "outro", label: "Outro", sort: 50 },
  ];
  for (const d of defaults) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${table} (id, code, label, active, sort_order)
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (code) DO NOTHING`,
      d.id,
      d.code,
      d.label,
      d.sort,
    );
  }
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
  await seedDefaultPaymentMethods(schemaName);
}
