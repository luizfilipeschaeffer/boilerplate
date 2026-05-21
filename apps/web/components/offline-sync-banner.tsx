"use client";

import * as React from "react";
import { useSyncContext } from "@/components/sync-provider";
import {
  clearOfflineSalesQueue,
  getOfflineSalesQueue,
  setOfflineSalesQueue,
} from "@/lib/offline/sales-queue";
import { Button } from "@/components/ui/button";

export function OfflineSyncBanner() {
  const { requestSync } = useSyncContext();
  const [pending, setPending] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const refresh = () => setPending(getOfflineSalesQueue().length);
    refresh();
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, []);

  async function sync() {
    const queue = getOfflineSalesQueue();
    if (queue.length === 0) return;
    setSyncing(true);
    setMessage(null);
    const remaining = [...queue];
    let index = 0;
    while (index < remaining.length) {
      const sale = remaining[index]!;
      try {
        const res = await fetch("/api/offline/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sale),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error ?? "Falha ao sincronizar",
          );
        }
        remaining.splice(index, 1);
        setOfflineSalesQueue(remaining);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Erro na sincronização");
        setSyncing(false);
        setPending(remaining.length);
        return;
      }
    }
    clearOfflineSalesQueue();
    setPending(0);
    setSyncing(false);
    setMessage("Fila offline sincronizada.");
    await requestSync(true);
  }

  if (pending === 0 && !message) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <span>
        {pending > 0
          ? `${pending} venda(s) na fila offline.`
          : message}
      </span>
      {pending > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={syncing || !navigator.onLine}
          onClick={() => void sync()}
        >
          {syncing ? "Sincronizando…" : "Sincronizar agora"}
        </Button>
      ) : null}
    </div>
  );
}
