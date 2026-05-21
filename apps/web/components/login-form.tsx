"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { isValidEmail } from "@/lib/mask-email";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({
  className,
  initialEmail = "",
  ...props
}: React.ComponentProps<"div"> & { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const emailNormalized = email.trim().toLowerCase();
  const canRecoverPassword = isValidEmail(emailNormalized);

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
      setError("Não foi possível entrar. Verifique e-mail e senha.");
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
              <LayoutGrid className="size-5" />
            </div>
            <h1 className="text-xl font-bold">Boilerplate</h1>
            <p className="text-sm text-muted-foreground">
              Gestão modular adaptativa
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="voce@empresa.com"
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
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
            {canRecoverPassword ? (
              <Button
                type="button"
                variant="link"
                nativeButton={false}
                render={
                  <Link
                    href={`/esqueci-senha?email=${encodeURIComponent(emailNormalized)}`}
                  />
                }
                className="h-auto justify-start p-0 text-xs text-muted-foreground"
              >
                Não sei minha senha
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Informe seu e-mail acima para recuperar o acesso.
              </p>
            )}
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
                "Entrar"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
