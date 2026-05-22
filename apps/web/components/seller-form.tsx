"use client";

import * as React from "react";
import {
  createSellerAction,
  updateSellerAction,
} from "@/app/actions/sellers";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type SellerFormValues = {
  name: string;
  email: string;
  commission: string;
};

export function SellerForm({
  sellerId,
  initialValues,
  submitLabel = "Cadastrar",
  onSuccess,
}: {
  sellerId?: string;
  initialValues?: SellerFormValues;
  submitLabel?: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const isEdit = Boolean(sellerId);
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [email, setEmail] = React.useState(initialValues?.email ?? "");
  const [commission, setCommission] = React.useState(
    initialValues?.commission ?? "",
  );
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = {
        name,
        email: email || undefined,
        commissionPercent: commission || undefined,
      };
      if (isEdit && sellerId) {
        await updateSellerAction({ id: sellerId, ...payload });
      } else {
        await createSellerAction(payload);
        setName("");
        setEmail("");
        setCommission("");
      }
      await onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Erro ao salvar vendedor"
            : "Erro ao cadastrar vendedor",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <FieldGroup className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Nome</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel>E-mail (opcional)</FieldLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Comissão (%)</FieldLabel>
          <Input
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </Field>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function commissionBpToFormValue(bp: number): string {
  const pct = bp / 100;
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
}
