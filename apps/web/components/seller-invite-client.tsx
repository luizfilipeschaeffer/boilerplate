"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  acceptSellerInviteAction,
  getSellerInviteAction,
} from "@/app/actions/seller-invite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SellerInviteClient({
  tokenPromise,
}: {
  tokenPromise: Promise<string>;
}) {
  const router = useRouter();
  const [token, setToken] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<string>("loading");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    void tokenPromise.then(async (t) => {
      setToken(t);
      if (!t) {
        setStatus("invalid");
        return;
      }
      const info = await getSellerInviteAction(t);
      if (!info) {
        setStatus("invalid");
        return;
      }
      setEmail(info.email);
      setStatus(info.status);
    });
  }, [tokenPromise]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await acceptSellerInviteAction({
      token,
      password,
      name: name || undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/login?email=${encodeURIComponent(result.email)}`);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Carregando convite…</p>
      </div>
    );
  }

  if (status === "invalid" || status === "expired" || status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite indisponível</CardTitle>
            <CardDescription>
              {status === "expired"
                ? "Este link expirou. Peça um novo convite ao gestor."
                : status === "accepted"
                  ? "Este convite já foi utilizado."
                  : "Link inválido."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acesso de vendedor</CardTitle>
          <CardDescription>
            Defina sua senha para {email} e acesse o painel comercial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando…" : "Criar acesso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
