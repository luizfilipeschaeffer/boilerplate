"use client";

import * as React from "react";
import { getBasicReportAction } from "@/app/actions/reports";
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

export function RelatoriosView() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [report, setReport] = React.useState<
    Awaited<ReturnType<typeof getBasicReportAction>> | null
  >(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBasicReportAction(
        from || undefined,
        to || undefined,
      );
      setReport(data);
      if (!from) setFrom(data.range.from);
      if (!to) setTo(data.range.to);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  React.useEffect(() => {
    void load();
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Período, ticket médio e contas em atraso (inadimplência operacional).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            De
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Até
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <Button type="button" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {report && !loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vendas no período</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {report.period.saleCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Receita</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatBRL(report.period.revenueCents)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ticket médio</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatBRL(report.period.ticketMedioCents)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Canceladas</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {report.period.canceladas}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contas vencidas</CardTitle>
              <CardDescription>
                Saídas previstas com vencimento passado (inadimplência)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma conta vencida no momento.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Atraso</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.overdue.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          {new Date(row.due_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.days_overdue} dia(s)
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatBRL(row.amount_cents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Carregando relatório…</p>
      )}
    </div>
  );
}
