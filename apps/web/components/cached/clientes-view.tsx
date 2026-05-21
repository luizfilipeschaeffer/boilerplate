"use client";

import { ClientesHeaderToolbar } from "@/components/clientes-header-toolbar";
import {
  ClientsDataTable,
  type ClientRow,
} from "@/components/clients-data-table";
import { useCachedStore } from "@/hooks/use-cached-store";
import type { CachedClient } from "@/lib/idb/types";
import { Spinner } from "@/components/ui/spinner";

export function ClientesCachedView() {
  const { data, loading } = useCachedStore<CachedClient>("clients");

  const items: ClientRow[] = data.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    active: c.active ?? true,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-8 lg:px-6">
      <ClientesHeaderToolbar />
      {loading ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Carregando clientes…
        </div>
      ) : (
        <ClientsDataTable items={items} />
      )}
    </div>
  );
}
