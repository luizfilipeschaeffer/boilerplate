import type { IdbStoreName, SyncMeta } from "./types";

const DB_VERSION = 1;

function dbName(organizationId: string) {
  return `boilerplate-tenant-${organizationId}`;
}

function openDatabase(organizationId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName(organizationId), DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("clients")) {
        db.createObjectStore("clients", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("catalog")) {
        db.createObjectStore("catalog", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("sales")) {
        db.createObjectStore("sales", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
  });
}

function tx<T>(
  db: IDBDatabase,
  store: IdbStoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const objectStore = transaction.objectStore(store);
    const result = fn(objectStore);
    transaction.oncomplete = () => {
      if (result instanceof IDBRequest) {
        resolve(result.result as T);
      } else {
        resolve();
      }
    };
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

export async function getAllFromStore<T>(
  organizationId: string,
  store: Exclude<IdbStoreName, "meta">,
): Promise<T[]> {
  const db = await openDatabase(organizationId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, "readonly");
    const objectStore = transaction.objectStore(store);
    const request = objectStore.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function putMany<T extends { id: string }>(
  organizationId: string,
  store: Exclude<IdbStoreName, "meta">,
  rows: T[],
): Promise<void> {
  const db = await openDatabase(organizationId);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const objectStore = transaction.objectStore(store);
    for (const row of rows) {
      objectStore.put(row);
    }
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteManyIds(
  organizationId: string,
  store: Exclude<IdbStoreName, "meta">,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDatabase(organizationId);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const objectStore = transaction.objectStore(store);
    for (const id of ids) {
      objectStore.delete(id);
    }
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSyncMeta(
  organizationId: string,
): Promise<SyncMeta | null> {
  const db = await openDatabase(organizationId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("meta", "readonly");
    const request = transaction.objectStore("meta").get("sync");
    request.onsuccess = () => resolve((request.result as SyncMeta) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function setSyncMeta(
  organizationId: string,
  meta: SyncMeta,
): Promise<void> {
  const db = await openDatabase(organizationId);
  await tx(db, "meta", "readwrite", (s) => s.put(meta));
  db.close();
}

export async function clearTenantCache(organizationId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName(organizationId));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
