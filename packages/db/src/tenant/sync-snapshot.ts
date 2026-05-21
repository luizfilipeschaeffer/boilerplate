import { prisma } from "../client";
import { assertSafeSchemaName } from "./schema";
import { listCatalogItems } from "./catalog";
import { listClients } from "./clients";
import { listLowStockItems } from "./stock";
import { listSales, type SaleWithItems } from "./sales";

export type SyncSnapshot = {
  revision: string;
  syncedAt: string;
  clients: Awaited<ReturnType<typeof listClients>>;
  catalog: Awaited<ReturnType<typeof listCatalogItems>>;
  stock: {
    lowCount: number;
    lowIds: string[];
  };
  sales: SaleWithItems[];
};

export async function getTenantSyncSnapshot(
  schemaName: string,
  since?: Date | null,
): Promise<SyncSnapshot> {
  assertSafeSchemaName(schemaName);
  const syncedAt = new Date().toISOString();

  const [clients, catalog, sales, low] = await Promise.all([
    listClientsSince(schemaName, since),
    listCatalogSince(schemaName, since),
    listSalesSince(schemaName, since),
    listLowStockItems(schemaName),
  ]);

  const revision = new Date().toISOString();

  return {
    revision,
    syncedAt,
    clients,
    catalog,
    stock: {
      lowCount: low.length,
      lowIds: low.map((i) => i.id),
    },
    sales,
  };
}

async function listClientsSince(schemaName: string, since?: Date | null) {
  const all = await listClients(schemaName);
  if (!since) return all;
  return all.filter((r) => new Date(r.updated_at) > since);
}

async function listCatalogSince(schemaName: string, since?: Date | null) {
  const all = await listCatalogItems(schemaName);
  if (!since) return all;
  return all.filter((r) => new Date(r.updated_at) > since);
}

async function listSalesSince(schemaName: string, since?: Date | null) {
  const all = await listSales(schemaName, 200);
  if (!since) return all;
  return all.filter((r) => new Date(r.created_at) > since);
}

/** IDs atuais no servidor — para remover registros deletados do cache local. */
export async function getTenantSyncIds(schemaName: string) {
  assertSafeSchemaName(schemaName);
  const schema = schemaName;
  const [clientIds, catalogIds, saleIds] = await Promise.all([
    prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${schema}"."clients"`,
    ),
    prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${schema}"."catalog_items"`,
    ),
    prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${schema}"."sales"`,
    ),
  ]);
  return {
    clients: clientIds.map((r) => r.id),
    catalog: catalogIds.map((r) => r.id),
    sales: saleIds.map((r) => r.id),
  };
}
