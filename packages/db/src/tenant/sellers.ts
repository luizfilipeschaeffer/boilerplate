import { randomUUID } from "node:crypto";
import { prisma } from "../client";
import {
  assertSafeSchemaName,
  tenantSalesTable,
  tenantSellersTable,
} from "./schema";

export interface SellerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  commission_rate_bp: number;
  active: boolean;
  created_at: Date;
}

export interface SellerWithStats extends SellerRow {
  sale_count: number;
  total_cents: number;
}

export async function listSellers(schemaName: string): Promise<SellerRow[]> {
  assertSafeSchemaName(schemaName);
  const table = tenantSellersTable(schemaName);
  return prisma.$queryRawUnsafe<SellerRow[]>(
    `SELECT id, name, email, phone, user_id, commission_rate_bp, active, created_at
     FROM ${table}
     ORDER BY name ASC`,
  );
}

export async function listSellersWithStats(
  schemaName: string,
): Promise<SellerWithStats[]> {
  assertSafeSchemaName(schemaName);
  const sellersTable = tenantSellersTable(schemaName);
  const salesTable = tenantSalesTable(schemaName);

  return prisma.$queryRawUnsafe<SellerWithStats[]>(
    `SELECT s.id, s.name, s.email, s.phone, s.user_id, s.commission_rate_bp, s.active, s.created_at,
            COUNT(sa.id)::int AS sale_count,
            COALESCE(SUM(sa.total_cents), 0)::int AS total_cents
     FROM ${sellersTable} s
     LEFT JOIN ${salesTable} sa ON sa.seller_id = s.id AND sa.status = 'confirmada'
     GROUP BY s.id, s.name, s.email, s.phone, s.commission_rate_bp, s.active, s.created_at
     ORDER BY s.name ASC`,
  );
}

export async function createSeller(
  schemaName: string,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    commissionRateBp?: number;
  },
): Promise<SellerRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantSellersTable(schemaName);
  const id = randomUUID();
  const name = input.name.trim();
  if (!name) throw new Error("Nome do vendedor é obrigatório");

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (id, name, email, phone, commission_rate_bp)
     VALUES ($1, $2, $3, $4, $5)`,
    id,
    name,
    input.email?.trim() ?? null,
    input.phone?.trim() ?? null,
    Math.max(0, Math.min(10000, input.commissionRateBp ?? 0)),
  );

  const rows = await prisma.$queryRawUnsafe<SellerRow[]>(
    `SELECT id, name, email, phone, user_id, commission_rate_bp, active, created_at
     FROM ${table} WHERE id = $1`,
    id,
  );
  return rows[0]!;
}

export async function updateSeller(
  schemaName: string,
  id: string,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    commissionRateBp?: number;
  },
): Promise<SellerRow> {
  assertSafeSchemaName(schemaName);
  const table = tenantSellersTable(schemaName);
  const name = input.name.trim();
  if (!name) throw new Error("Nome do vendedor é obrigatório");

  await prisma.$executeRawUnsafe(
    `UPDATE ${table}
     SET name = $2, email = $3, phone = $4, commission_rate_bp = $5, updated_at = NOW()
     WHERE id = $1`,
    id,
    name,
    input.email?.trim() ?? null,
    input.phone?.trim() ?? null,
    Math.max(0, Math.min(10000, input.commissionRateBp ?? 0)),
  );

  const rows = await prisma.$queryRawUnsafe<SellerRow[]>(
    `SELECT id, name, email, phone, commission_rate_bp, active, created_at
     FROM ${table} WHERE id = $1`,
    id,
  );
  const row = rows[0];
  if (!row) throw new Error("Vendedor não encontrado");
  return row;
}

export async function setSellerActive(
  schemaName: string,
  id: string,
  active: boolean,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantSellersTable(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET active = $2, updated_at = NOW() WHERE id = $1`,
    id,
    active,
  );
}

export async function linkSellerToUser(
  schemaName: string,
  sellerId: string,
  userId: string,
): Promise<void> {
  assertSafeSchemaName(schemaName);
  const table = tenantSellersTable(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET user_id = $2, updated_at = NOW() WHERE id = $1`,
    sellerId,
    userId,
  );
}

export async function getSellerByUserId(
  schemaName: string,
  userId: string,
): Promise<SellerRow | null> {
  assertSafeSchemaName(schemaName);
  const table = tenantSellersTable(schemaName);
  const rows = await prisma.$queryRawUnsafe<SellerRow[]>(
    `SELECT id, name, email, phone, user_id, commission_rate_bp, active, created_at
     FROM ${table} WHERE user_id = $1 LIMIT 1`,
    userId,
  );
  return rows[0] ?? null;
}
