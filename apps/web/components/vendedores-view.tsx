"use client";

import * as React from "react";
import {
  createSellerAction,
  listSellersAction,
  setSellerActiveAction,
} from "@/app/actions/sellers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

export function VendedoresView() {
  const [sellers, setSellers] = React.useState<
    Awaited<ReturnType<typeof listSellersAction>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [commission, setCommission] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setSellers(await listSellersAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendedores</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre a equipe e atribua vendas no registro de pedidos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await createSellerAction({
                  name,
                  email: email || undefined,
                  commissionPercent: commission || undefined,
                });
                setName("");
                setEmail("");
                setCommission("");
                await reload();
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              Nome
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              E-mail
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Comissão (%)
              <Input
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="0"
              />
            </label>
            <Button type="submit" disabled={saving}>
              Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : sellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vendedor cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.name}
                      {!s.active ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (inativo)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {(s.commission_rate_bp / 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.sale_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatBRL(s.total_cents)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await setSellerActiveAction(s.id, !s.active);
                          await reload();
                        }}
                      >
                        {s.active ? "Desativar" : "Ativar"}
                      </Button>
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
