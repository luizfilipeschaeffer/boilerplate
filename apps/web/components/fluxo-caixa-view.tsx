"use client";

import * as React from "react";
import {
  createCashFlowEntryAction,
  getCashFlowDashboardAction,
  markPayablePaidAction,
} from "@/app/actions/cash-flow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [entryType, setEntryType] = React.useState<"entrada" | "saida">("entrada");
  const [status, setStatus] = React.useState<"realizado" | "previsto">("realizado");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setData(await getCashFlowDashboardAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fluxo de caixa</h1>
        <p className="text-sm text-muted-foreground">
          Entradas, saídas e contas a pagar. Vendas confirmadas geram entrada
          automática.
        </p>
      </div>

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
          <CardTitle className="text-base">Novo lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await createCashFlowEntryAction({
                  entryType,
                  amountReais: amount,
                  description,
                  status,
                  dueDate:
                    status === "previsto" && dueDate ? dueDate : null,
                  category:
                    status === "previsto" ? "conta_pagar" : undefined,
                });
                setAmount("");
                setDescription("");
                setDueDate("");
                await reload();
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <select
                className="rounded-md border px-2 py-1.5"
                value={entryType}
                onChange={(e) =>
                  setEntryType(e.target.value as "entrada" | "saida")
                }
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Status
              <select
                className="rounded-md border px-2 py-1.5"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "realizado" | "previsto")
                }
              >
                <option value="realizado">Realizado</option>
                <option value="previsto">Previsto (conta a pagar)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valor (R$)
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
              Descrição
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            {status === "previsto" ? (
              <label className="flex flex-col gap-1 text-sm">
                Vencimento
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </label>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Adicionar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : !data?.entries.length ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs">
                      {new Date(row.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {row.entry_type === "entrada" ? "Entrada" : "Saída"}
                      {row.status === "previsto" ? " · previsto" : ""}
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        row.entry_type === "saida"
                          ? "text-destructive"
                          : "text-emerald-600"
                      }`}
                    >
                      {formatBRL(row.amount_cents)}
                    </TableCell>
                    <TableCell>
                      {row.entry_type === "saida" &&
                      row.status === "previsto" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await markPayablePaidAction(row.id);
                            await reload();
                          }}
                        >
                          Pagar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
