"use client";

import * as React from "react";
import { getAllFromStore, getSyncMeta } from "@/lib/idb/database";
import { CACHE_UPDATED_EVENT, type IdbStoreName } from "@/lib/idb/types";
import { useSyncContext } from "@/components/sync-provider";

export function useCachedStore<T extends { id: string }>(
  store: Exclude<IdbStoreName, "meta">,
) {
  const { organizationId } = useSyncContext();
  const cacheKey = `${organizationId ?? ""}:${store}`;
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [prevCacheKey, setPrevCacheKey] = React.useState(cacheKey);

  if (cacheKey !== prevCacheKey) {
    setPrevCacheKey(cacheKey);
    setData([]);
    setLoading(Boolean(organizationId));
  }

  const load = React.useCallback(() => {
    if (!organizationId) {
      setLoading(false);
      return Promise.resolve();
    }
    return getAllFromStore<T>(organizationId, store)
      .then((rows) => {
        setData(rows);
      })
      .catch(() => {
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [organizationId, store]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const handler = () => void load();
    window.addEventListener(CACHE_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CACHE_UPDATED_EVENT, handler);
  }, [load]);

  return { data, loading, reload: load };
}

export function useSyncMeta() {
  const { organizationId, lastSyncedAt, lastError, syncing } = useSyncContext();
  const [idbMeta, setIdbMeta] = React.useState<{
    lastSyncedAt: string | null;
    lastError: string | null;
  } | null>(null);

  React.useEffect(() => {
    if (!organizationId) return;
    void getSyncMeta(organizationId).then((m) => {
      if (m) {
        setIdbMeta({
          lastSyncedAt: m.lastSyncedAt,
          lastError: m.lastError,
        });
      }
    });
  }, [organizationId, lastSyncedAt, syncing]);

  return {
    lastSyncedAt: lastSyncedAt ?? idbMeta?.lastSyncedAt ?? null,
    lastError: lastError ?? idbMeta?.lastError ?? null,
    syncing,
    organizationId,
  };
}
