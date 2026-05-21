import { prisma } from "../client";
import { assertSafeSchemaName } from "./schema";

const TENANT_DDL = (schema: string) => `
CREATE SCHEMA IF NOT EXISTS "${schema}";

CREATE TABLE IF NOT EXISTS "${schema}"."catalog_items" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'produto',
  sku TEXT,
  price_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "${schema}"."clients" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function provisionTenantSchema(schemaName: string): Promise<void> {
  assertSafeSchemaName(schemaName);
  await prisma.$executeRawUnsafe(TENANT_DDL(schemaName));
}
