const STORAGE_KEY = "boilerplate-offline-sales-v1";

export type OfflineSalePayload = {
  clientId?: string | null;
  paymentMethod: string;
  lines: { catalogItemId: string; quantity: number }[];
  idempotencyKey?: string | null;
};

export type QueuedSale = OfflineSalePayload & {
  queuedAt: string;
};

export function getOfflineSalesQueue(): QueuedSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedSale[];
  } catch {
    return [];
  }
}

export function enqueueOfflineSale(payload: OfflineSalePayload): void {
  const queue = getOfflineSalesQueue();
  queue.push({
    ...payload,
    idempotencyKey: payload.idempotencyKey ?? crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function clearOfflineSalesQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function setOfflineSalesQueue(queue: QueuedSale[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}
