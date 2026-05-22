"use client";

import * as React from "react";
import {
  getCashFlowDashboardAction,
  markPayablePaidAction,
} from "@/app/actions/cash-flow";
import { CashFlowDataTable } from "@/components/cash-flow-data-table";
import { FluxoCaixaHeaderToolbar } from "@/components/fluxo-caixa-header-toolbar";
import { SetHeaderInfo } from "@/components/header-actions-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function FluxoCaixaView() {
  const [data, setData] = React.useState<
    Awaited<ReturnType<typeof getCashFlowDashboardAction>> | null
  >(null);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setData(await getCashFlowDashboardAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await getCashFlowDashboardAction();
        if (!cancelled) setData(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;

  const headerInfo =
    "Entradas, saídas e contas a pagar. Vendas confirmadas geram entrada automática.";

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <FluxoCaixaHeaderToolbar onEntryCreated={reload} />
      <SetHeaderInfo>{headerInfo}</SetHeaderInfo>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo realizado</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatBRL(summary.saldoRealizado)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo projetado</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatBRL(summary.saldoProjetado)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Inclui lançamentos previstos (contas a pagar)
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Previsto a pagar</CardDescription>
              <CardTitle className="text-2xl tabular-nums text-destructive">
                {formatBRL(summary.saidasPrevistas)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <CashFlowDataTable
              entries={data?.entries ?? []}
              onMarkPaid={async (entryId) => {
                await markPayablePaidAction(entryId);
                await reload();
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
