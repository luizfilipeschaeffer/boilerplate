"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, LayoutGrid } from "lucide-react";

import {
  completePasswordReset,
  confirmPasswordResetCode,
  requestPasswordReset,
} from "@/app/actions/password-reset";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { maskEmail } from "@/lib/mask-email";

type Step = "code" | "password" | "done";

const SENT_MESSAGE =
  "Se existir uma conta com este e-mail, enviamos um código de recuperação. Confira sua caixa de entrada e o spam.";

export function EsqueciSenhaForm({
  email,
  initialCode = "",
  autoCopy = false,
  skipSendEmail = false,
}: {
  email: string;
  initialCode?: string;
  autoCopy?: boolean;
  skipSendEmail?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("code");
  const [sentMessage, setSentMessage] = React.useState<string | null>(
    skipSendEmail ? SENT_MESSAGE : null,
  );
  const [code, setCode] = React.useState(initialCode);
  const [copied, setCopied] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sentOnce = React.useRef(false);

  React.useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    if (skipSendEmail) return;
    void (async () => {
      const { message } = await requestPasswordReset(email);
      setSentMessage(message);
    })();
  }, [email, skipSendEmail]);

  React.useEffect(() => {
    if (!autoCopy || initialCode.length !== 6) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    void navigator.clipboard.writeText(initialCode).then(() => {
      setCopied(true);
      timeoutId = setTimeout(() => setCopied(false), 2500);
    });
    return () => clearTimeout(timeoutId);
  }, [autoCopy, initialCode]);

  async function handleCopyCode() {
    if (code.length !== 6) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await confirmPasswordResetCode(email, code);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Código inválido ou expirado.");
      return;
    }
    setStep("password");
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    const { message } = await requestPasswordReset(email);
    setSentMessage(message);
    setResending(false);
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await completePasswordReset(email, password, confirm);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Não foi possível salvar a senha.");
      return;
    }
    setStep("done");
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2000);
  }

  const loginHref = `/login?email=${encodeURIComponent(email)}`;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col">
        <FieldGroup className="gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LayoutGrid className="size-5" />
            </div>
            <h1 className="text-xl font-bold">Recuperar acesso</h1>
            <p className="text-xs text-muted-foreground">
              {maskEmail(email)}
            </p>
          </div>

          {sentMessage ? (
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              {sentMessage}
            </p>
          ) : (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {step === "code" ? (
            <form
              onSubmit={(e) => void handleVerifyCode(e)}
              className="flex flex-col gap-6"
            >
              <Field>
                <FieldLabel htmlFor="reset-code">Código de 6 dígitos</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="reset-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setCopied(false);
                    }}
                    disabled={loading || !sentMessage}
                    required
                    className="flex-1 text-center tracking-[0.3em]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    disabled={code.length !== 6 || loading || !sentMessage}
                    onClick={() => void handleCopyCode()}
                    title="Copiar código"
                  >
                    {copied ? (
                      <Check className="size-4 text-primary" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    <span className="sr-only">Copiar código</span>
                  </Button>
                </div>
                {copied ? (
                  <p className="text-xs text-primary">Código copiado!</p>
                ) : null}
              </Field>
              {error ? <FieldError role="alert">{error}</FieldError> : null}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || code.length !== 6 || !sentMessage}
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Verificando…
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={resending || !sentMessage}
                  onClick={() => void handleResend()}
                >
                  {resending ? "Reenviando…" : "Reenviar código"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === "password" ? (
            <form
              onSubmit={(e) => void handleSetPassword(e)}
              className="flex flex-col gap-6"
            >
              <p className="text-center text-sm text-muted-foreground">
                Código confirmado. Defina sua nova senha.
              </p>
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirmar senha
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                  />
                </Field>
              </div>
              {error ? <FieldError role="alert">{error}</FieldError> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    Salvando…
                  </>
                ) : (
                  "Salvar e entrar"
                )}
              </Button>
            </form>
          ) : null}

          {step === "done" ? (
            <p className="py-4 text-center text-sm text-primary">
              Senha atualizada! Redirecionando para o login…
            </p>
          ) : null}
        </FieldGroup>

        <div className="mt-12 border-t border-border pt-8">
          <p className="mb-3 text-center text-xs text-muted-foreground">
            Quer tentar de outro jeito?
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={loginHref} />}
            className="mx-auto flex h-auto w-full text-muted-foreground"
          >
            Voltar ao login
          </Button>
        </div>
      </div>
    </div>
  );
}
