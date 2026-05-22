"use client";

import * as React from "react";
import { createCashFlowEntryAction } from "@/app/actions/cash-flow";
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

export function CashFlowEntryForm({
  onSuccess,
}: {
  onSuccess?: () => void | Promise<void>;
}) {
  const [entryType, setEntryType] = React.useState<"entrada" | "saida">("entrada");
  const [status, setStatus] = React.useState<"realizado" | "previsto">("realizado");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await createCashFlowEntryAction({
        entryType,
        amountReais: amount,
        description,
        status,
        dueDate: status === "previsto" && dueDate ? dueDate : null,
        category: status === "previsto" ? "conta_pagar" : undefined,
      });
      setAmount("");
      setDescription("");
      setDueDate("");
      setEntryType("entrada");
      setStatus("realizado");
      await onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar lançamento",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Tipo</FieldLabel>
          <Select
            value={entryType}
            onValueChange={(v) =>
              setEntryType((v as "entrada" | "saida") ?? "entrada")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus((v as "realizado" | "previsto") ?? "realizado")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="previsto">Previsto (conta a pagar)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Valor (R$)</FieldLabel>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            required
          />
        </Field>
        <Field>
          <FieldLabel>Descrição</FieldLabel>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        {status === "previsto" ? (
          <Field>
            <FieldLabel>Vencimento</FieldLabel>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </Field>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
