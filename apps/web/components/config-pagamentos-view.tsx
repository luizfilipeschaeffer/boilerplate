"use client";

import * as React from "react";
import {
  createPaymentMethodAction,
  listPaymentMethodsAction,
  updatePaymentMethodAction,
} from "@/app/actions/payment-methods";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";

export function ConfigPagamentosView() {
  const [methods, setMethods] = React.useState<
    Awaited<ReturnType<typeof listPaymentMethodsAction>>
  >([]);
  const [code, setCode] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setMethods(await listPaymentMethodsAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            placeholder="Código (ex.: boleto)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="max-w-[160px]"
          />
          <Input
            placeholder="Nome exibido"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="max-w-[220px]"
          />
          <Button
            onClick={async () => {
              await createPaymentMethodAction({ code, label });
              setCode("");
              setLabel("");
              await reload();
            }}
          >
            Adicionar
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Formas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.code}</TableCell>
                    <TableCell>{m.label}</TableCell>
                    <TableCell>
                      <Switch
                        checked={m.active}
                        onCheckedChange={(active) =>
                          void updatePaymentMethodAction({
                            id: m.id,
                            active,
                          }).then(reload)
                        }
                      />
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
