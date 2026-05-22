"use client";

import * as React from "react";
import {
  cancelOrderAction,
  convertOrderAction,
  listOrdersAction,
  upsertOrderAction,
} from "@/app/actions/orders";
import { getSaleFormDataAction } from "@/app/actions/sales";
import { listPaymentMethodsAction } from "@/app/actions/payment-methods";
import { SetHeaderInfo } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
function formatBrl(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function PedidosView() {
  const [orders, setOrders] = React.useState<
    Awaited<ReturnType<typeof listOrdersAction>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<
    Awaited<ReturnType<typeof getSaleFormDataAction>> | null
  >(null);
  const [paymentMethods, setPaymentMethods] = React.useState<
    Awaited<ReturnType<typeof listPaymentMethodsAction>>
  >([]);
  const [clientId, setClientId] = React.useState("_none");
  const [sellerId, setSellerId] = React.useState("_none");
  const [catalogItemId, setCatalogItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [convertId, setConvertId] = React.useState<string | null>(null);
  const [convertPayment, setConvertPayment] = React.useState("dinheiro");
  const [pending, setPending] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await listOrdersAction());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
    void listPaymentMethodsAction(true).then(setPaymentMethods);
  }, [reload]);

  React.useEffect(() => {
    if (!open) return;
    void Promise.all([
      getSaleFormDataAction(),
      listPaymentMethodsAction(true),
    ]).then(([fd, pm]) => {
      setFormData(fd);
      setPaymentMethods(pm);
    });
  }, [open]);

  async function createOrder() {
    if (!catalogItemId) return;
    setPending(true);
    try {
      await upsertOrderAction({
        status: "pedido",
        clientId: clientId === "_none" ? null : clientId,
        sellerId: sellerId === "_none" ? null : sellerId,
        lines: [
          {
            catalogItemId,
            quantity: Math.max(1, parseInt(quantity, 10) || 1),
          },
        ],
      });
      setOpen(false);
      await reload();
    } finally {
      setPending(false);
    }
  }

  async function doConvert() {
    if (!convertId) return;
    setPending(true);
    try {
      await convertOrderAction(
        convertId,
        convertPayment as
          | "dinheiro"
          | "pix"
          | "cartao_credito"
          | "cartao_debito"
          | "outro",
      );
      setConvertId(null);
      await reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <SetHeaderInfo text="Pré-vendas que podem ser convertidas em venda confirmada com baixa de estoque." />
      <div className="flex justify-end">
        <Button type="button" onClick={() => setOpen(true)}>
          Novo pedido
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo pedido</DialogTitle>
            </DialogHeader>
            {formData ? (
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sem cliente</SelectItem>
                      {formData.clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <Select value={sellerId} onValueChange={setSellerId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">—</SelectItem>
                      {formData.sellers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={catalogItemId}
                    onValueChange={setCatalogItemId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.items.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <Button onClick={() => void createOrder()} disabled={pending}>
                  Salvar pedido
                </Button>
              </div>
            ) : (
              <Spinner />
            )}
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos abertos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pedido em aberto.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Badge variant="secondary">{o.status}</Badge>
                    </TableCell>
                    <TableCell>{o.client_name ?? "—"}</TableCell>
                    <TableCell>{o.seller_name ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBrl(o.total_cents)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setConvertId(o.id)}
                      >
                        Converter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void cancelOrderAction(o.id).then(reload)}
                      >
                        Cancelar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(convertId)}
        onOpenChange={(v) => !v && setConvertId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Forma de pagamento</Label>
            <Select
              value={convertPayment}
              onValueChange={setConvertPayment}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(paymentMethods.length
                  ? paymentMethods
                  : [
                      { code: "dinheiro", label: "Dinheiro" },
                      { code: "pix", label: "PIX" },
                    ]
                ).map((pm) => (
                  <SelectItem key={pm.code} value={pm.code}>
                    {"label" in pm ? pm.label : pm.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => void doConvert()} disabled={pending}>
              Confirmar venda
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
