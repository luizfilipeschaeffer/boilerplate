"use client";

import { useSyncMeta } from "@/hooks/use-cached-store";
import { useSyncContext } from "@/components/sync-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function formatTime(iso: string | null) {
  if (!iso) return "nunca";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function SyncStatus() {
  const { lastSyncedAt, lastError, syncing } = useSyncMeta();
  const { requestSync } = useSyncContext();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {syncing ? <Spinner className="size-3" /> : null}
      <span>
        Cache: {formatTime(lastSyncedAt)}
        {lastError ? ` · ${lastError}` : null}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={syncing}
        onClick={() => void requestSync(true)}
      >
        Sync
      </Button>
    </div>
  );
}
