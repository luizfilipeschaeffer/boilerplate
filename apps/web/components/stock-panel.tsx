"use client";

import * as React from "react";
import { adjustStockAction, setStockMinAction } from "@/app/actions/stock";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type StockProduct = {
  id: string;
  name: string;
  stockQty: number;
  stockMin: number;
  isLow: boolean;
};

export function StockPanel({ products }: { products: StockProduct[] }) {
  const { requestSync } = useSyncContext();
  const [selectedId, setSelectedId] = React.useState("");
  const [movementType, setMovementType] = React.useState<"entrada" | "saida" | "ajuste">("entrada");
  const [quantity, setQuantity] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onMove(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setPending(true);
    await adjustStockAction({
      catalogItemId: selectedId,
      movementType,
      quantity: parseInt(quantity, 10) || 1,
      note: note || null,
    });
    await requestSync();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onMove}>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field className="md:col-span-2">
            <FieldLabel>Produto</FieldLabel>
            <Select
              value={selectedId}
              onValueChange={(v) => setSelectedId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stockQty} un.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Movimento</FieldLabel>
            <Select
              value={movementType}
              onValueChange={(v) =>
                setMovementType((v ?? "entrada") as "entrada" | "saida" | "ajuste")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste (definir saldo)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Quantidade</FieldLabel>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>Observação</FieldLabel>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending || !selectedId}>
              {pending ? "Salvando…" : "Registrar movimento"}
            </Button>
          </div>
        </FieldGroup>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Mínimo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-right tabular-nums">{p.stockQty}</TableCell>
              <TableCell className="text-right">
                <MinStockInput
                  productId={p.id}
                  initial={p.stockMin}
                />
              </TableCell>
              <TableCell>
                {p.isLow ? (
                  <Badge variant="destructive">Baixo</Badge>
                ) : (
                  <Badge variant="outline">OK</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MinStockInput({
  productId,
  initial,
}: {
  productId: string;
  initial: number;
}) {
  const { requestSync } = useSyncContext();
  const [val, setVal] = React.useState(String(initial));
  return (
    <Input
      className="ml-auto w-20 text-right"
      type="number"
      min={0}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() =>
        void setStockMinAction(productId, parseInt(val, 10) || 0).then(() =>
          requestSync(),
        )
      }
    />
  );
}
