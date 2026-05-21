"use client";

import * as React from "react";
import { createCatalogAction } from "@/app/actions/catalog";
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

export function CatalogForm() {
  const [name, setName] = React.useState("");
  const [itemType, setItemType] = React.useState<"produto" | "servico">("produto");
  const [sku, setSku] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const priceCents = price
      ? Math.round(parseFloat(price.replace(",", ".")) * 100)
      : null;
    await createCatalogAction({
      name,
      itemType,
      sku: sku || null,
      priceCents: Number.isFinite(priceCents) ? priceCents : null,
    });
    setName("");
    setSku("");
    setPrice("");
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2">
          <FieldLabel>Nome</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Produto ou serviço"
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
        <Field>
          <FieldLabel>Preço (R$)</FieldLabel>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
          />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Adicionar item"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
