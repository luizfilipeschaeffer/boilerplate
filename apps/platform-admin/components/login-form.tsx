"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error || !res?.ok) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Shield className="size-5" />
            </div>
            <h1 className="text-xl font-bold">Boilerplate Admin</h1>
            <p className="text-sm text-muted-foreground">
              Acesso interno — comercial, suporte, produto e engenharia
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="email">E-mail corporativo</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="voce@boilerplate.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>

          {error ? <FieldError role="alert">{error}</FieldError> : null}

          <Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="mr-2" />
                  Entrando…
                </>
              ) : (
                "Entrar no painel"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
