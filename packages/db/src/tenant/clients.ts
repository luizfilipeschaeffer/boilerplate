import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import { assertSafeSchemaName, tenantClientsTable } from "./schema";

export interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function listClients(schemaName: string): Promise<ClientRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantClientsTable(schemaName);
  return prisma.$queryRawUnsafe<ClientRow[]>(
    `SELECT id, name, email, phone, active, created_at, updated_at
     FROM ${table}
     ORDER BY active DESC, name ASC`,
  );
}

export async function createClient(
  schemaName: string,
  data: { name: string; email?: string | null; phone?: string | null },
): Promise<ClientRow> {
  assertSafeSchemaName(schemaName);
  const id = randomUUID();
  const table = tenantClientsTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<ClientRow[]>(
    `INSERT INTO ${table} (id, name, email, phone, active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, name, email, phone, active, created_at, updated_at`,
    id,
    data.name,
    data.email ?? null,
    data.phone ?? null,
  );
  return rows[0]!;
}

export async function updateClient(
  schemaName: string,
  id: string,
  data: { name: string; email?: string | null; phone?: string | null },
): Promise<ClientRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantClientsTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<ClientRow[]>(
    `UPDATE ${table}
     SET name = $2, email = $3, phone = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, phone, active, created_at, updated_at`,
    id,
    data.name,
    data.email ?? null,
    data.phone ?? null,
  );
  if (!rows[0]) throw new Error("Cliente não encontrado");
  return rows[0];
}

export async function setClientActive(
  schemaName: string,
  id: string,
  active: boolean,
): Promise<ClientRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantClientsTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<ClientRow[]>(
    `UPDATE ${table}
     SET active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, phone, active, created_at, updated_at`,
    id,
    active,
  );
  if (!rows[0]) throw new Error("Cliente não encontrado");
  return rows[0];
}

export async function deleteClient(
  schemaName: string,
  id: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantClientsTable(schemaName);
  await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE id = $1`, id);
}
