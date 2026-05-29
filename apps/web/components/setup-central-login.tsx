"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  callbackUrl: string;
};

export function SetupCentralLogin({ callbackUrl }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const res = await signIn("central", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });

    setPending(false);

    if (res?.error || !res?.ok) {
      setError(
        "Não foi possível entrar. Use o e-mail e a senha da conta cliente (criada no cadastro da plataforma), não a conta staff do painel interno.",
      );
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="setup-central-email">E-mail da conta Boilerplate</Label>
        <Input
          id="setup-central-email"
          type="email"
          autoComplete="username"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="setup-central-password">Senha</Label>
        <Input
          id="setup-central-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? (
          <>
            <Spinner className="mr-2" />
            Entrando…
          </>
        ) : (
          "Entrar com conta Boilerplate"
        )}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </form>
  );
}
