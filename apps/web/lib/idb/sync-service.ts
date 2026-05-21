import {
  deleteManyIds,
  getAllFromStore,
  getSyncMeta,
  putMany,
  setSyncMeta,
} from "./database";
import { FULL_RECONCILE_EVERY, SYNC_INTERVAL_MS } from "./sync-config";
import {
  CACHE_UPDATED_EVENT,
  type CachedCatalogItem,
  type CachedClient,
  type CachedSale,
  type CachedStockProduct,
} from "./types";

type SyncApiResponse = {
  revision: string;
  syncedAt: string;
  clients: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    active: boolean;
    updated_at: string;
  }[];
  catalog: {
    id: string;
    name: string;
    item_type: string;
    sku: string | null;
    price_cents: number | null;
    stock_qty: number;
    stock_min: number;
    active: boolean;
    updated_at: string;
  }[];
  stock: { lowCount: number; lowIds: string[] };
  sales: {
    id: string;
    client_id: string | null;
    status: string;
    payment_method: string;
    total_cents: number;
    created_at: string;
    client_name: string | null;
    items: {
      id: string;
      catalog_item_id: string;
      quantity: number;
      unit_price_cents: number;
      line_total_cents: number;
      item_name: string;
    }[];
  }[];
  ids?: {
    clients: string[];
    catalog: string[];
    sales: string[];
  };
};

let syncGeneration = 0;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let activeOrgId: string | null = null;
let syncInFlight = false;
let incrementalCount = 0;
let lowStockIds: string[] = [];

function mapClients(rows: SyncApiResponse["clients"]): CachedClient[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    active: r.active ?? true,
    updatedAt: r.updated_at,
  }));
}

function mapCatalog(rows: SyncApiResponse["catalog"]): CachedCatalogItem[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    itemType: r.item_type as "produto" | "servico",
    sku: r.sku,
    priceCents: r.price_cents,
    stockQty: r.stock_qty,
    stockMin: r.stock_min,
    active: r.active ?? true,
    updatedAt: r.updated_at,
  }));
}

function mapSales(rows: SyncApiResponse["sales"]): CachedSale[] {
  return rows.map((s) => ({
    id: s.id,
    clientId: s.client_id,
    clientName: s.client_name,
    status: s.status,
    paymentMethod: s.payment_method,
    totalCents: s.total_cents,
    createdAt: s.created_at,
    items: s.items.map((it) => ({
      id: it.id,
      catalogItemId: it.catalog_item_id,
      itemName: it.item_name,
      quantity: it.quantity,
      unitPriceCents: it.unit_price_cents,
      lineTotalCents: it.line_total_cents,
    })),
  }));
}

function notifyCacheUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CACHE_UPDATED_EVENT));
}

async function reconcileDeletions(
  organizationId: string,
  ids: NonNullable<SyncApiResponse["ids"]>,
) {
  for (const store of ["clients", "catalog", "sales"] as const) {
    const local = await getAllFromStore<{ id: string }>(organizationId, store);
    const serverSet = new Set(ids[store]);
    const toRemove = local.filter((r) => !serverSet.has(r.id)).map((r) => r.id);
    await deleteManyIds(organizationId, store, toRemove);
  }
}

export async function pullTenantSync(
  organizationId: string,
  options?: { full?: boolean },
): Promise<{ ok: boolean; error?: string; syncedAt?: string }> {
  if (typeof window === "undefined") return { ok: false, error: "SSR" };
  if (syncInFlight) return { ok: true };
  syncInFlight = true;
  const gen = ++syncGeneration;

  try {
    const meta = await getSyncMeta(organizationId);
    const since = options?.full ? null : meta?.lastSyncedAt;
    const reconcile =
      options?.full ||
      incrementalCount >= FULL_RECONCILE_EVERY ||
      !since;

    const params = new URLSearchParams();
    if (since && !options?.full) params.set("since", since);
    if (reconcile) params.set("reconcile", "1");

    const res = await fetch(`/api/sync?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `Sync falhou (${res.status})`,
      );
    }

    const data = (await res.json()) as SyncApiResponse;
    if (gen !== syncGeneration) return { ok: true };

    const isFull = !since || options?.full;

    if (isFull) {
      await putMany(organizationId, "clients", mapClients(data.clients));
      await putMany(organizationId, "catalog", mapCatalog(data.catalog));
      await putMany(organizationId, "sales", mapSales(data.sales));
    } else {
      if (data.clients.length > 0) {
        await putMany(organizationId, "clients", mapClients(data.clients));
      }
      if (data.catalog.length > 0) {
        await putMany(organizationId, "catalog", mapCatalog(data.catalog));
      }
      if (data.sales.length > 0) {
        await putMany(organizationId, "sales", mapSales(data.sales));
      }
    }

    lowStockIds = data.stock.lowIds;

    if (data.ids) {
      await reconcileDeletions(organizationId, data.ids);
      incrementalCount = 0;
    } else {
      incrementalCount += 1;
    }

    await setSyncMeta(organizationId, {
      key: "sync",
      organizationId,
      lastSyncedAt: data.syncedAt,
      revision: data.revision,
      lastError: null,
    });

    notifyCacheUpdated();
    return { ok: true, syncedAt: data.syncedAt };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro de sync";
    const prev = await getSyncMeta(organizationId);
    await setSyncMeta(organizationId, {
      key: "sync",
      organizationId,
      lastSyncedAt: prev?.lastSyncedAt ?? null,
      revision: prev?.revision ?? null,
      lastError: message,
    });
    notifyCacheUpdated();
    return { ok: false, error: message };
  } finally {
    syncInFlight = false;
  }
}

export function requestTenantSync(
  organizationId: string,
  options?: { full?: boolean },
) {
  return pullTenantSync(organizationId, options);
}

export function getLowStockIds() {
  return lowStockIds;
}

export function startTenantSyncLoop(
  organizationId: string,
  intervalMs = SYNC_INTERVAL_MS,
) {
  if (typeof window === "undefined") return () => undefined;

  if (activeOrgId === organizationId && intervalHandle) {
    return () => undefined;
  }

  stopTenantSyncLoop();
  activeOrgId = organizationId;
  incrementalCount = 0;

  void pullTenantSync(organizationId, { full: true });

  intervalHandle = setInterval(() => {
    void pullTenantSync(organizationId);
  }, intervalMs);

  const onOnline = () => void pullTenantSync(organizationId, { full: true });
  const onFocus = () => void pullTenantSync(organizationId);
  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onFocus);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onFocus);
  };
}

export function stopTenantSyncLoop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  activeOrgId = null;
}

export function buildStockFromCatalog(
  catalog: CachedCatalogItem[],
  lowIds: string[] = lowStockIds,
): { products: CachedStockProduct[]; lowCount: number } {
  const lowSet = new Set(lowIds);
  const products = catalog
    .filter((i) => i.itemType === "produto")
    .map((i) => ({
      id: i.id,
      name: i.name,
      stockQty: i.stockQty,
      stockMin: i.stockMin,
      isLow: lowSet.has(i.id),
    }));
  return { products, lowCount: products.filter((p) => p.isLow).length };
}
