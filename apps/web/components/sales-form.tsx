"use client";

import * as React from "react";
import { createSaleAction } from "@/app/actions/sales";
import { useSyncContext } from "@/components/sync-provider";
import type { SalesFormData } from "@/components/vendas-header-toolbar";
import { enqueueOfflineSale } from "@/lib/offline/sales-queue";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SalesForm({
  data,
  layout = "grid",
  onSuccess,
}: {
  data: SalesFormData;
  layout?: "grid" | "stack";
  onSuccess?: () => void;
}) {
  const { requestSync } = useSyncContext();
  const [clientId, setClientId] = React.useState<string>("_none");
  const [paymentMethod, setPaymentMethod] = React.useState("dinheiro");
  const [catalogItemId, setCatalogItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [pending, setPending] = React.useState(false);
  const [offlineMsg, setOfflineMsg] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catalogItemId) return;
    setPending(true);
    setOfflineMsg(null);

    const payload = {
      clientId: clientId === "_none" ? null : clientId,
      paymentMethod: paymentMethod as
        | "dinheiro"
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "outro",
      lines: [
        {
          catalogItemId,
          quantity: Math.max(1, parseInt(quantity, 10) || 1),
        },
      ],
      idempotencyKey: crypto.randomUUID(),
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineSale(payload);
      setOfflineMsg(
        "Venda salva na fila offline. Sincronize quando voltar à internet.",
      );
      setPending(false);
      return;
    }

    try {
      await createSaleAction(payload);
      await requestSync();
      setCatalogItemId("");
      setQuantity("1");
      onSuccess?.();
    } catch (err) {
      setOfflineMsg(
        err instanceof Error ? err.message : "Erro ao registrar venda",
      );
    }
    setPending(false);
  }

  const isStack = layout === "stack";
  const hasItems = data.items.length > 0;

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <FieldGroup
        className={
          isStack ? "flex flex-col gap-4" : "grid gap-4 md:grid-cols-2"
        }
      >
        <Field>
          <FieldLabel>Cliente (opcional)</FieldLabel>
          <Select
            value={clientId}
            onValueChange={(v) => setClientId(v ?? "_none")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sem cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sem cliente</SelectItem>
              {data.clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Pagamento</FieldLabel>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v ?? "dinheiro")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="cartao_credito">Cartão crédito</SelectItem>
              <SelectItem value="cartao_debito">Cartão débito</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field className={isStack ? undefined : "md:col-span-2"}>
          <FieldLabel>Item</FieldLabel>
          <Select
            value={catalogItemId}
            onValueChange={(v) => setCatalogItemId(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione do catálogo" />
            </SelectTrigger>
            <SelectContent>
              {data.items.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                  {i.itemType === "produto" ? ` (est: ${i.stockQty})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasItems ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Cadastre itens ativos no catálogo antes de registrar vendas.
            </p>
          ) : null}
        </Field>
        <Field>
          <FieldLabel>Quantidade</FieldLabel>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </Field>
        <div className={isStack ? undefined : "flex items-end"}>
          <Button
            type="submit"
            className={isStack ? "w-full" : undefined}
            disabled={pending || !catalogItemId || !hasItems}
          >
            {pending ? "Registrando…" : "Confirmar venda"}
          </Button>
        </div>
        {offlineMsg ? (
          <p
            className={
              isStack
                ? "text-sm text-amber-600 dark:text-amber-400"
                : "md:col-span-2 text-sm text-amber-600 dark:text-amber-400"
            }
          >
            {offlineMsg}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}
