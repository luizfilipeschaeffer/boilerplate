"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { useDebugMode } from "@/components/debug-mode-provider";
import { SyncStatus } from "@/components/sync-status";
import { useSyncMeta } from "@/hooks/use-cached-store";
import { useSyncSchedule } from "@/hooks/use-sync-schedule";
import { SYNC_INTERVAL_MS } from "@/lib/idb/sync-config";
import { getAllFromStore } from "@/lib/idb/database";
import type { IdbStoreName } from "@/lib/idb/types";
import { cn } from "@/lib/utils";

function DebugStat({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="truncate font-mono text-[11px] text-foreground">
        {value}
      </span>
    </div>
  );
}

async function loadStoreCounts(organizationId: string) {
  const stores: Exclude<IdbStoreName, "meta">[] = [
    "clients",
    "catalog",
    "sales",
  ];
  const entries = await Promise.all(
    stores.map(async (store) => {
      const rows = await getAllFromStore(organizationId, store);
      return [store, rows.length] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<string, number>;
}

export function DebugBar() {
  const { enabled } = useDebugMode();
  const pathname = usePathname();
  const { organizationId, lastSyncedAt, lastError, syncing } = useSyncMeta();
  const syncSchedule = useSyncSchedule();
  const [online, setOnline] = React.useState(
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
  );
  const [counts, setCounts] = React.useState<Record<string, number> | null>(
    null,
  );

  const countsLoadKey =
    enabled && organizationId ? `${organizationId}:${lastSyncedAt ?? ""}` : "";
  const [prevCountsLoadKey, setPrevCountsLoadKey] =
    React.useState(countsLoadKey);
  if (countsLoadKey !== prevCountsLoadKey) {
    setPrevCountsLoadKey(countsLoadKey);
    setCounts(null);
  }

  React.useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  React.useEffect(() => {
    if (!countsLoadKey || !organizationId) return;
    let cancelled = false;
    void loadStoreCounts(organizationId).then((next) => {
      if (!cancelled) setCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [countsLoadKey, organizationId]);

  if (!enabled) return null;

  const cacheLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString("pt-BR")
    : "nunca";

  return (
    <div
      role="region"
      aria-label="Barra de debug"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm md:px-4"
    >
      <div className="mx-auto flex max-w-[100vw] flex-wrap items-end gap-x-6 gap-y-2">
        <div className="flex shrink-0 items-center gap-2 border-r pr-4">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
            DEBUG
          </span>
          <span className="text-[10px] text-muted-foreground">
            Ctrl+Shift+U
          </span>
        </div>

        <div className="flex shrink-0 items-center">
          <SyncStatus />
        </div>

        <DebugStat label="Rota" value={pathname} />
        <DebugStat
          label="Rede"
          value={online ? "online" : "offline"}
          className={online ? undefined : "text-destructive"}
        />
        <DebugStat
          label="Sync"
          value={syncing ? "em andamento" : "ocioso"}
        />
        <DebugStat
          label="Próximo sync"
          value={
            !syncSchedule.active
              ? "loop inativo"
              : syncing || syncSchedule.inFlight
                ? "executando…"
                : syncSchedule.countdown != null
                  ? `${syncSchedule.countdown} (${Math.round(syncSchedule.intervalMs / 1000)}s)`
                  : `— (${Math.round(SYNC_INTERVAL_MS / 1000)}s)`
          }
        />
        <DebugStat label="Cache (IDB)" value={cacheLabel} />
        {lastError ? (
          <DebugStat
            label="Erro sync"
            value={lastError}
            className="max-w-xs text-destructive"
          />
        ) : null}
        <DebugStat
          label="Org"
          value={organizationId ?? "—"}
          className="max-w-[12rem]"
        />
        {countsLoadKey && counts ? (
          <DebugStat
            label="IDB"
            value={`clientes ${counts.clients ?? 0} · catálogo ${counts.catalog ?? 0} · vendas ${counts.sales ?? 0}`}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Espaço inferior para o conteúdo não ficar atrás da barra fixa. */
export function DebugBarSpacer() {
  const { enabled } = useDebugMode();
  if (!enabled) return null;
  return <div className="h-14 shrink-0" aria-hidden />;
}
