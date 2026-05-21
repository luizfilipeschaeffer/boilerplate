import { prisma } from "../client";
import {
  assertSafeSchemaName,
  tenantAprendizPerfilTable,
  tenantAprendizTable,
} from "./schema";

export async function listAprendizAutomacoes(
  schemaName: string,
): Promise<{ template_id: string; enabled: boolean }[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizTable(schemaName);
  return prisma.$queryRawUnsafe<{ template_id: string; enabled: boolean }[]>(
    `SELECT template_id, enabled FROM ${table} ORDER BY template_id`,
  );
}

export async function isAprendizEnabled(
  schemaName: string,
  templateId: string,
): Promise<boolean> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ enabled: boolean }[]>(
    `SELECT enabled FROM ${table} WHERE template_id = $1`,
    templateId,
  );
  return rows[0]?.enabled ?? false;
}

export async function setAprendizAutomation(
  schemaName: string,
  templateId: string,
  enabled: boolean,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizTable(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (template_id, enabled, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (template_id) DO UPDATE SET enabled = $2, updated_at = NOW()`,
    templateId,
    enabled,
  );
}

export type AprendizPerfilRow = {
  owner_name: string;
  owner_email: string;
  negocio_nome: string;
  payload: Record<string, unknown>;
  primeiro_contato_at: Date;
};

export async function saveAprendizPerfilCadastro(
  schemaName: string,
  perfil: {
    ownerName: string;
    ownerEmail: string;
    organizationName: string;
    [key: string]: unknown;
  },
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizPerfilTable(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (id, owner_name, owner_email, negocio_nome, payload, primeiro_contato_at, updated_at)
     VALUES ('principal', $1, $2, $3, $4::jsonb, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       owner_name = EXCLUDED.owner_name,
       owner_email = EXCLUDED.owner_email,
       negocio_nome = EXCLUDED.negocio_nome,
       payload = EXCLUDED.payload,
       updated_at = NOW()`,
    perfil.ownerName,
    perfil.ownerEmail,
    perfil.organizationName,
    JSON.stringify(perfil),
  );
}

export async function getAprendizPerfil(
  schemaName: string,
): Promise<AprendizPerfilRow | null> {
  assertSafeSchemaName(schemaName);
  const table = tenantAprendizPerfilTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<AprendizPerfilRow[]>(
    `SELECT owner_name, owner_email, negocio_nome, payload, primeiro_contato_at
     FROM ${table} WHERE id = 'principal'`,
  );
  return rows[0] ?? null;
}
