"use client";

import * as React from "react";
import { listSellersAction } from "@/app/actions/sellers";
import { SetHeaderInfo } from "@/components/header-actions-context";
import { SellersDataTable } from "@/components/sellers-data-table";
import { VendedoresHeaderToolbar } from "@/components/vendedores-header-toolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function VendedoresView() {
  const [sellers, setSellers] = React.useState<
    Awaited<ReturnType<typeof listSellersAction>>
  >([]);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setSellers(await listSellersAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await listSellersAction();
        if (!cancelled) setSellers(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const headerInfo =
    "Cadastre a equipe e atribua vendas no registro de pedidos.";

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <VendedoresHeaderToolbar onSellerCreated={reload} />
      <SetHeaderInfo>{headerInfo}</SetHeaderInfo>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && sellers.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Carregando…
            </div>
          ) : (
            <SellersDataTable sellers={sellers} onChanged={reload} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
