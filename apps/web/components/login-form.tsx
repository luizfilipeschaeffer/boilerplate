"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { sendLoginVerificationCode } from "@/app/actions/login-verification";
import { LOGIN_CODE_INVALID } from "@/lib/auth/login-with-code";
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
import { INACTIVITY_LOGOUT_MINUTES } from "@/lib/inactivity-logout";

type LoginMode = "password" | "code";
type CodeStep = "email" | "code";

export function LoginForm({
  className,
  initialEmail = "",
  inactivityLogout = false,
  firstAccessHint = false,
  ...props
}: React.ComponentProps<"div"> & {
  initialEmail?: string;
  inactivityLogout?: boolean;
  firstAccessHint?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<LoginMode>(
    firstAccessHint ? "code" : "password",
  );
  const [codeStep, setCodeStep] = React.useState<CodeStep>("email");
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sendingCode, setSendingCode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(() => {
    if (firstAccessHint) {
      return "Primeiro acesso: informe seu e-mail, envie o código e entre sem senha. Você pode criar senha depois em Conta.";
    }
    if (inactivityLogout) {
      return `Sessão encerrada após ${INACTIVITY_LOGOUT_MINUTES} minutos sem atividade.`;
    }
    return null;
  });
  const [codeSentMessage, setCodeSentMessage] = React.useState<string | null>(
    null,
  );

  const emailNormalized = email.trim().toLowerCase();
  const canRecoverPassword = isValidEmail(emailNormalized);

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
    setCodeSentMessage(null);
    if (next === "code") {
      setCodeStep("email");
      setCode("");
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error || !res?.ok) {
      setError(
        "Não foi possível entrar. Verifique e-mail e senha — ou use o código por e-mail se ainda não criou senha.",
      );
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  async function requestCode() {
    if (!isValidEmail(emailNormalized)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setError(null);
    setInfo(null);
    setSendingCode(true);
    try {
      const { message } = await sendLoginVerificationCode(emailNormalized);
      setCodeSentMessage(message);
      setCodeStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar o código.",
      );
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    await requestCode();
  }

  async function handleCodeLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      email: emailNormalized,
      loginCode: code.replace(/\D/g, ""),
      password: "",
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error || !res?.ok) {
      setError(LOGIN_CODE_INVALID);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutGrid className="size-5" />
        </div>
        <h1 className="text-xl font-bold">Boilerplate</h1>
        <p className="text-sm text-muted-foreground">Gestão modular adaptativa</p>
      </div>

      <div className="flex rounded-lg border p-1">
        <Button
          type="button"
          variant={mode === "password" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => switchMode("password")}
        >
          Senha
        </Button>
        <Button
          type="button"
          variant={mode === "code" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => switchMode("code")}
        >
          Código por e-mail
        </Button>
      </div>

      {mode === "password" ? (
        <form method="post" onSubmit={handlePasswordSubmit} noValidate>
          <FieldGroup>
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

            {info ? (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            ) : null}

            {error ? <FieldError role="alert">{error}</FieldError> : null}

            <Field>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner className="mr-2" />
                    Entrando…
                  </>
                ) : (
                  "Entrar com senha"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {codeStep === "email" ? (
            <form onSubmit={(e) => void handleSendCode(e)} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="login-email-code">E-mail</FieldLabel>
                  <Input
                    id="login-email-code"
                    type="email"
                    autoComplete="username"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={sendingCode}
                  />
                </Field>

                {info ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    {info}
                  </p>
                ) : null}

                {error ? <FieldError role="alert">{error}</FieldError> : null}

                <Button type="submit" className="w-full" disabled={sendingCode}>
                  {sendingCode ? (
                    <>
                      <Spinner className="mr-2" />
                      Enviando código…
                    </>
                  ) : (
                    "Enviar código de acesso"
                  )}
                </Button>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={(e) => void handleCodeLogin(e)} noValidate>
              <FieldGroup>
                {codeSentMessage ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    {codeSentMessage}
                  </p>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="login-code">Código de 6 dígitos</FieldLabel>
                  <Input
                    id="login-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviado para {emailNormalized}
                  </p>
                </Field>

                {error ? <FieldError role="alert">{error}</FieldError> : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || code.length !== 6}
                >
                  {submitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Entrando…
                    </>
                  ) : (
                    "Entrar com código"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={sendingCode || submitting}
                  onClick={() => void requestCode()}
                >
                  Reenviar código
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setCodeStep("email");
                    setCode("");
                    setError(null);
                  }}
                >
                  Trocar e-mail
                </Button>
              </FieldGroup>
            </form>
          )}
        </div>
      )}

      {mode === "password" ? (
        <p className="text-center text-xs text-muted-foreground">
          Primeiro acesso ou sem senha?{" "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => switchMode("code")}
          >
            Entrar com código por e-mail
          </button>
        </p>
      ) : null}
    </div>
  );
}
