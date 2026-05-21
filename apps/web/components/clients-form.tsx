"use client";

import * as React from "react";
import {
  createClientAction,
  updateClientAction,
} from "@/app/actions/clients";
import { useSyncContext } from "@/components/sync-provider";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  emptyPhoneParts,
  formatPhoneForStorage,
  parsePhoneStored,
  validatePhoneParts,
  type PhoneParts,
} from "@/lib/format-phone";

export type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
};

export function ClientsForm({
  layout = "grid",
  clientId,
  initialValues,
  onSuccess,
  submitLabel = "Salvar cliente",
}: {
  layout?: "grid" | "stack";
  clientId?: string;
  initialValues?: ClientFormValues;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const { requestSync } = useSyncContext();
  const isEdit = Boolean(clientId);
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [email, setEmail] = React.useState(initialValues?.email ?? "");
  const [phoneParts, setPhoneParts] = React.useState<PhoneParts>(() =>
    parsePhoneStored(initialValues?.phone),
  );
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phoneValidation = validatePhoneParts(phoneParts);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }
    setPhoneError(null);
    setPending(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: formatPhoneForStorage(phoneParts),
      };
      if (isEdit && clientId) {
        await updateClientAction(clientId, payload);
      } else {
        await createClientAction(payload);
      }
      await requestSync();
      if (!isEdit) {
        setName("");
        setEmail("");
        setPhoneParts(emptyPhoneParts());
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
            placeholder="Ex.: Maria Silva"
            required
            autoFocus={isStack}
          />
        </Field>
        <Field>
          <FieldLabel>E-mail</FieldLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="opcional"
          />
        </Field>
        <Field className={isStack ? undefined : "md:col-span-2"}>
          <FieldLabel>Telefone (opcional)</FieldLabel>
          <PhoneInput
            parts={phoneParts}
            disabled={pending}
            onPartsChange={(next) => {
              setPhoneParts(next);
              setPhoneError(null);
            }}
          />
          <p className="text-xs text-muted-foreground">
            País (+55) · DDD · número
          </p>
          {phoneError ? (
            <p className="text-xs text-destructive" role="alert">
              {phoneError}
            </p>
          ) : null}
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
