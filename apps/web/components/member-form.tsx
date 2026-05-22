"use client";

import * as React from "react";
import { createMemberAction } from "@/app/actions/members";
import { ASSIGNABLE_ROLES, roleLabel } from "@/lib/role-labels";
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

export function MemberForm({
  onSuccess,
}: {
  onSuccess?: (
    result: Awaited<ReturnType<typeof createMemberAction>>,
  ) => void | Promise<void>;
}) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<string>("vendedor");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setPending(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await createMemberAction({
        email: trimmedEmail,
        name: name.trim() || undefined,
        role: role as (typeof ASSIGNABLE_ROLES)[number],
      });
      setFeedback(
        result.invite?.message ?? "Membro cadastrado com sucesso.",
      );
      setEmail("");
      setName("");
      setRole("vendedor");
      await onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao convidar membro.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="member-email">E-mail</FieldLabel>
          <Input
            id="member-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operador@empresa.com"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="member-name">Nome</FieldLabel>
          <Input
            id="member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Opcional"
          />
        </Field>
        <Field>
          <FieldLabel>Papel</FieldLabel>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="member-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {roleLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {feedback ? (
        <p className="text-sm text-muted-foreground">{feedback}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando convite…" : "Convidar e enviar e-mail"}
      </Button>
    </form>
  );
}
