"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { setAccountPassword } from "@/app/actions/account-password";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function ContaSenhaForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await setAccountPassword(password, confirm);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Não foi possível salvar a senha.");
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Check className="size-10 text-primary" />
        <p className="text-sm text-muted-foreground">
          Senha criada! Voltando ao painel…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <FieldGroup>
        <p className="text-sm text-muted-foreground">
          Conta: <span className="font-medium text-foreground">{email}</span>
        </p>
        <Field>
          <FieldLabel htmlFor="conta-password">Senha de acesso</FieldLabel>
          <Input
            id="conta-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="conta-password-confirm">Confirmar senha</FieldLabel>
          <Input
            id="conta-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a senha"
            required
            disabled={loading}
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Salvando…
            </>
          ) : (
            "Salvar senha"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
