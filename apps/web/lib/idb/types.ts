export type CachedClient = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  updatedAt: string;
};

export type CachedCatalogItem = {
  id: string;
  name: string;
  itemType: "produto" | "servico";
  sku: string | null;
  priceCents: number | null;
  stockQty: number;
  stockMin: number;
  categoryId: string | null;
  active: boolean;
  updatedAt: string;
};

export type CachedSaleItem = {
  id: string;
  catalogItemId: string;
  itemName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type CachedSale = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  status: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
  items: CachedSaleItem[];
};

export type CachedStockProduct = {
  id: string;
  name: string;
  stockQty: number;
  stockMin: number;
  isLow: boolean;
};

export type SyncMeta = {
  key: "sync";
  organizationId: string;
  lastSyncedAt: string | null;
  revision: string | null;
  lastError: string | null;
};

export type IdbStoreName = "clients" | "catalog" | "sales" | "meta";

export const CACHE_UPDATED_EVENT = "boilerplate-cache-updated";
