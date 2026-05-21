"use client";

import * as React from "react";
import {
  pullTenantSync,
  startTenantSyncLoop,
  stopTenantSyncLoop,
} from "@/lib/idb/sync-service";
import { SYNC_INTERVAL_MS } from "@/lib/idb/sync-config";

type SyncContextValue = {
  organizationId: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  syncing: boolean;
  requestSync: (full?: boolean) => Promise<void>;
};

const SyncContext = React.createContext<SyncContextValue | null>(null);

export function useSyncContext() {
  const ctx = React.useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSyncContext deve ser usado dentro de SyncProvider");
  }
  return ctx;
}

export function SyncProvider({
  organizationId,
  children,
}: {
  organizationId: string;
  children: React.ReactNode;
}) {
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  const requestSync = React.useCallback(
    async (full?: boolean) => {
      setSyncing(true);
      const result = await pullTenantSync(organizationId, { full });
      if (result.ok) {
        setLastError(null);
        setLastSyncedAt(result.syncedAt ?? new Date().toISOString());
      } else if (result.error) {
        setLastError(result.error);
      }
      setSyncing(false);
    },
    [organizationId],
  );

  React.useEffect(() => {
    const cleanupFocus = startTenantSyncLoop(organizationId, SYNC_INTERVAL_MS);
    return () => {
      cleanupFocus?.();
      stopTenantSyncLoop();
    };
  }, [organizationId]);

  React.useEffect(() => {
    const onCache = () => {
      setLastSyncedAt(new Date().toISOString());
      setLastError(null);
    };
    window.addEventListener("boilerplate-cache-updated", onCache);
    return () => window.removeEventListener("boilerplate-cache-updated", onCache);
  }, []);

  const value = React.useMemo(
    () => ({
      organizationId,
      lastSyncedAt,
      lastError,
      syncing,
      requestSync,
    }),
    [organizationId, lastSyncedAt, lastError, syncing, requestSync],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
