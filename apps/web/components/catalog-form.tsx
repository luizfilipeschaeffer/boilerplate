"use client";

import * as React from "react";
import {
  createCatalogAction,
  updateCatalogAction,
} from "@/app/actions/catalog";
import { useSyncContext } from "@/components/sync-provider";
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

export type CatalogFormValues = {
  name: string;
  itemType: "produto" | "servico";
  sku: string;
  price: string;
};

function parsePriceCents(price: string): number | null {
  const priceCents = price
    ? Math.round(parseFloat(price.replace(",", ".")) * 100)
    : null;
  return Number.isFinite(priceCents) ? priceCents : null;
}

export function CatalogForm({
  layout = "grid",
  itemId,
  initialValues,
  onSuccess,
  submitLabel = "Salvar item",
}: {
  layout?: "grid" | "stack";
  itemId?: string;
  initialValues?: CatalogFormValues;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const { requestSync } = useSyncContext();
  const isEdit = Boolean(itemId);
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [itemType, setItemType] = React.useState<"produto" | "servico">(
    initialValues?.itemType ?? "produto",
  );
  const [sku, setSku] = React.useState(initialValues?.sku ?? "");
  const [price, setPrice] = React.useState(initialValues?.price ?? "");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const payload = {
        name: name.trim(),
        itemType,
        sku: sku.trim() || null,
        priceCents: parsePriceCents(price),
      };
      if (isEdit && itemId) {
        await updateCatalogAction(itemId, payload);
      } else {
        await createCatalogAction(payload);
      }
      await requestSync();
      if (!isEdit) {
        setName("");
        setSku("");
        setPrice("");
        setItemType("produto");
      }
      onSuccess?.();
    } finally {
      setPending(false);
    }
  }

  const isStack = layout === "stack";

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <FieldGroup
        className={
          isStack ? "flex flex-col gap-4" : "grid gap-4 md:grid-cols-2"
        }
      >
        <Field className={isStack ? undefined : "md:col-span-2"}>
          <FieldLabel>Nome</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Produto ou serviço"
            autoFocus={isStack}
          />
        </Field>
        <Field>
          <FieldLabel>Tipo</FieldLabel>
          <Select
            value={itemType}
            onValueChange={(v) => setItemType(v as "produto" | "servico")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="produto">Produto</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>SKU (opcional)</FieldLabel>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} />
        </Field>
        <Field className={isStack ? undefined : "md:col-span-2"}>
          <FieldLabel>Preço (R$)</FieldLabel>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
          />
        </Field>
        <div className={isStack ? undefined : "md:col-span-2"}>
          <Button
            type="submit"
            className={isStack ? "w-full" : undefined}
            disabled={pending}
          >
            {pending ? "Salvando…" : submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
