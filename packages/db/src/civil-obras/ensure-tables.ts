import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";

export function civilObrasDdlStatements(schema: string): string[] {
  return [
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_obras" (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      endereco TEXT NOT NULL DEFAULT '',
      data_inicio DATE NOT NULL,
      data_prevista_conclusao DATE,
      status TEXT NOT NULL DEFAULT 'planejada',
      fiscal_membership_id TEXT,
      max_upload_image_mb INTEGER NOT NULL DEFAULT 50,
      max_upload_video_mb INTEGER NOT NULL DEFAULT 500,
      soft_deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_obras_tenant_status_idx"
      ON "${schema}"."civil_obras_obras" (tenant_id, status)`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_obras_tenant_nome_idx"
      ON "${schema}"."civil_obras_obras" (tenant_id, nome)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_usuarios" (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT,
      perfil TEXT NOT NULL DEFAULT 'colaborador',
      token_convite TEXT,
      token_expires_at TIMESTAMPTZ,
      senha_hash TEXT,
      opt_in_whatsapp BOOLEAN NOT NULL DEFAULT false,
      revoked_at TIMESTAMPTZ,
      session_version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "civil_obras_usuarios_email_obra_idx"
      ON "${schema}"."civil_obras_usuarios" (obra_id, email)`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_usuarios_token_idx"
      ON "${schema}"."civil_obras_usuarios" (token_convite) WHERE token_convite IS NOT NULL`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_entradas" (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      autor_id TEXT NOT NULL,
      titulo TEXT NOT NULL,
      corpo JSONB NOT NULL DEFAULT '{}',
      data_registro TIMESTAMPTZ NOT NULL,
      publicada BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_entradas_obra_data_idx"
      ON "${schema}"."civil_obras_entradas" (obra_id, data_registro DESC)`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_entradas_search_idx"
      ON "${schema}"."civil_obras_entradas"
      USING gin (to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(corpo::text, '')))`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_midias" (
      id TEXT PRIMARY KEY,
      entrada_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      url_storage TEXT NOT NULL,
      thumbnail_url TEXT,
      tamanho_bytes BIGINT NOT NULL DEFAULT 0,
      nome_original TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_midias_entrada_idx"
      ON "${schema}"."civil_obras_midias" (entrada_id)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_mencoes" (
      id TEXT PRIMARY KEY,
      entrada_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_mencoes_entrada_idx"
      ON "${schema}"."civil_obras_mencoes" (entrada_id)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_eventos" (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '',
      data_evento TIMESTAMPTZ NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'marco',
      entrada_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_eventos_obra_data_idx"
      ON "${schema}"."civil_obras_eventos" (obra_id, data_evento)`,
    `CREATE TABLE IF NOT EXISTS "${schema}"."civil_obras_relatorios" (
      id TEXT PRIMARY KEY,
      obra_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      periodo_inicio DATE NOT NULL,
      periodo_fim DATE NOT NULL,
      pdf_url TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      gerado_por TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS "civil_obras_relatorios_obra_idx"
      ON "${schema}"."civil_obras_relatorios" (obra_id, created_at DESC)`,
  ];
}

export async function ensureTenantCivilObrasTables(schemaName: string): Promise<void> {
  assertSafeSchemaName(schemaName);
  for (const sql of civilObrasDdlStatements(schemaName)) {
    await prisma.$executeRawUnsafe(sql);
  }
}
