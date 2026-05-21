"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User } from "lucide-react";

import {
  confirmSignupEmailCode,
  sendSignupVerificationCode,
} from "@/app/actions/email-verification";
import { registerAndOnboard } from "@/app/actions/signup";
import { AprendizAvatar } from "@/components/aprendiz/aprendiz-avatar";
import { cn } from "@/lib/utils";
import { persistSignupDraft } from "@/app/actions/signup-draft";
import { draftToOnboardingInput } from "@/lib/diagnostico/draft";
import {
  applyAnswer,
  formatUserAnswer,
  getStep,
  INITIAL_SIGNUP_DRAFT,
  type SignupDraft,
  type SignupStepId,
} from "@/lib/signup-chat/steps";
import {
  getSignupStepRawValue,
  truncateMessagesToStep,
  type ChatMessage,
  type StepHistoryEntry,
} from "@/lib/chat/step-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function promptFor(stepId: SignupStepId, draft: SignupDraft): string {
  const step = getStep(stepId);
  return typeof step.prompt === "function" ? step.prompt(draft) : step.prompt;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initialWelcomeMessages(): ChatMessage[] {
  const step = getStep("welcome");
  const content =
    typeof step.prompt === "function"
      ? step.prompt(INITIAL_SIGNUP_DRAFT)
      : step.prompt;
  return [
    {
      id: "aprendiz-welcome",
      role: "aprendiz",
      content,
      stepId: "welcome",
    },
  ];
}

/** Primeiro contato com o Aprendiz — cadastro conversacional. */
export function AprendizCadastroChat({
  className,
  onBackToLogin,
}: {
  className?: string;
  onBackToLogin: () => void;
}) {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [draft, setDraft] = React.useState<SignupDraft>(INITIAL_SIGNUP_DRAFT);
  const [currentStep, setCurrentStep] = React.useState<SignupStepId>("welcome");
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    initialWelcomeMessages,
  );
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [finished, setFinished] = React.useState(false);
  const [sendingCode, setSendingCode] = React.useState(false);
  const [history, setHistory] = React.useState<
    StepHistoryEntry<SignupStepId, SignupDraft>[]
  >([]);
  const scrollToBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const pushMessage = React.useCallback(
    (role: ChatMessage["role"], content: string, stepId?: SignupStepId) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${role}-${prev.length}-${Date.now()}`,
          role,
          content,
          stepId,
        },
      ]);
    },
    [],
  );

  async function showAprendiz(stepId: SignupStepId, nextDraft: SignupDraft) {
    const step = getStep(stepId);
    if (step.skip?.(nextDraft)) {
      const next = step.next(nextDraft);
      if (next) {
        setCurrentStep(next);
        await showAprendiz(next, nextDraft);
      }
      return;
    }
    setTyping(true);
    await delay(500);
    setTyping(false);
    pushMessage("aprendiz", promptFor(stepId, nextDraft), stepId);
    setCurrentStep(stepId);
    scrollToBottom();
    if (step.kind !== "info" && step.kind !== "choices") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  const step = getStep(currentStep);
  const choiceOptions =
    step.kind === "choices"
      ? typeof step.choices === "function"
        ? step.choices(draft)
        : step.choices
      : undefined;

  function recordAnswer(
    stepId: SignupStepId,
    draftBefore: SignupDraft,
    rawValue: string,
  ) {
    setHistory((prev) => [...prev, { stepId, draftBefore, rawValue }]);
  }

  function goBackToStep(targetStepId: SignupStepId) {
    if (submitting || typing || sendingCode) return;
    const entryIndex = history.findLastIndex((e) => e.stepId === targetStepId);
    if (entryIndex < 0) return;
    const entry = history[entryIndex];
    setHistory((prev) => prev.slice(0, entryIndex));
    setMessages((prev) => truncateMessagesToStep(prev, targetStepId));
    setDraft(entry.draftBefore);
    setCurrentStep(targetStepId);
    const answered = applyAnswer(entry.stepId, entry.rawValue, entry.draftBefore);
    setInput(getSignupStepRawValue(entry.stepId, answered));
    setInputError(null);
    setFinished(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function goBack() {
    if (history.length === 0) return;
    goBackToStep(history[history.length - 1].stepId);
  }

  async function goNext(stepId: SignupStepId, rawValue: string) {
    const stepDef = getStep(stepId);
    if (stepDef.kind === "info") {
      const next = stepDef.next(draft);
      if (next) {
        setCurrentStep(next);
        await showAprendiz(next, draft);
      }
      return;
    }

    const err = stepDef.validate?.(rawValue, draft) ?? null;
    if (err) {
      setInputError(err);
      return;
    }
    setInputError(null);

    const draftBefore = draft;
    let nextDraft = applyAnswer(stepId, rawValue, draft);

    if (stepId === "email") {
      setDraft(nextDraft);
      pushMessage("user", formatUserAnswer(stepId, rawValue, draft), stepId);
      recordAnswer(stepId, draftBefore, rawValue);
      setInput("");
      void persistSignupDraft(nextDraft);
      setSendingCode(true);
      setInputError(null);
      try {
        await sendSignupVerificationCode(nextDraft.email, nextDraft.name);
      } catch (e) {
        setSendingCode(false);
        setInputError(
          e instanceof Error ? e.message : "Não consegui enviar o código.",
        );
        return;
      }
      setSendingCode(false);
      const nextId = stepDef.next(nextDraft);
      if (!nextId) return;
      setCurrentStep(nextId);
      await showAprendiz(nextId, nextDraft);
      return;
    }

    if (stepId === "emailCode") {
      const { verified } = await confirmSignupEmailCode(
        nextDraft.email,
        rawValue,
      );
      if (!verified) {
        setInputError("Código incorreto ou expirado. Tente de novo ou peça um novo código.");
        return;
      }
    }

    setDraft(nextDraft);
    pushMessage("user", formatUserAnswer(stepId, rawValue, draft), stepId);
    recordAnswer(stepId, draftBefore, rawValue);
    setInput("");
    if (nextDraft.email) {
      void persistSignupDraft(nextDraft);
    }

    const nextId = stepDef.next(nextDraft);
    if (!nextId) return;

    if (nextId === "summary") {
      setCurrentStep("summary");
      await showAprendiz("summary", nextDraft);
      await finishSignup(nextDraft);
      return;
    }

    setCurrentStep(nextId);
    await showAprendiz(nextId, nextDraft);
  }

  async function finishSignup(finalDraft: SignupDraft) {
    setSubmitting(true);
    setFinished(true);
    try {
      const payload = draftToOnboardingInput(finalDraft);
      const { automacoesAtivas } = await registerAndOnboard(payload);
      const res = await signIn("credentials", {
        email: payload.email,
        password: "signup",
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        pushMessage(
          "aprendiz",
          "Guardei tudo que aprendi. Entre com seu e-mail na tela de login para me encontrar de novo.",
        );
        setSubmitting(false);
        return;
      }

      const n = automacoesAtivas.length;
      pushMessage(
        "aprendiz",
        n > 0
          ? `Pronto! Ativei ${n} automação${n > 1 ? "ões" : ""} inicial${n > 1 ? "is" : ""} com base no que aprendi. Te espero no painel do Aprendiz.`
          : "Pronto! Sua conta está criada. Te espero no painel do Aprendiz — vou continuar aprendendo com você.",
      );
      await delay(800);
      router.push("/aprendiz?primeiroContato=1");
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Não consegui concluir agora. Tente de novo.";
      pushMessage("aprendiz", msg);
      setSubmitting(false);
      setFinished(false);
    }
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (typing || submitting || finished) return;
    if (step.kind === "info") {
      const next = step.next(draft);
      if (next) await goNext(currentStep, "");
      return;
    }
    if (step.kind === "choices") return;
    const value = input.trim();
    if (!value && step.id !== "cnpj") return;
    await goNext(currentStep, value || "pular");
  }

  async function handleChoice(value: string) {
    if (typing || submitting) return;
    await goNext(currentStep, value);
  }

  async function resendCode() {
    if (!draft.email || sendingCode) return;
    setInputError(null);
    setSendingCode(true);
    try {
      await sendSignupVerificationCode(draft.email, draft.name);
      pushMessage(
        "aprendiz",
        "Enviei um novo código para o seu e-mail. O anterior deixa de valer.",
      );
    } catch (e) {
      setInputError(
        e instanceof Error ? e.message : "Não consegui reenviar o código.",
      );
    } finally {
      setSendingCode(false);
    }
  }

  const showTextInput =
    !finished &&
    !typing &&
    !sendingCode &&
    (step.kind === "text" ||
      step.kind === "email" ||
      step.kind === "code") &&
    currentStep !== "summary";

  const showContinueInfo =
    !finished && !typing && step.kind === "info" && currentStep === "welcome";

  const canGoBack =
    history.length > 0 &&
    !finished &&
    !submitting &&
    !typing &&
    !sendingCode &&
    currentStep !== "summary";

  return (
    <div
      className={cn(
        "flex h-[min(640px,85vh)] w-full max-w-md flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <AprendizAvatar size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-none">Aprendiz</p>
          <p className="truncate text-xs text-muted-foreground">
            Primeiro contato — estou aprendendo sobre você
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBackToLogin}>
          Já tenho conta
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            {msg.role === "aprendiz" ? (
              <AprendizAvatar size="sm" />
            ) : (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-4" />
              </div>
            )}
            {msg.role === "user" && msg.stepId && !finished && !submitting ? (
              <button
                type="button"
                title="Corrigir esta resposta"
                onClick={() => goBackToStep(msg.stepId as SignupStepId)}
                className={cn(
                  "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-left text-sm leading-relaxed text-primary-foreground",
                  "transition-opacity hover:opacity-90",
                )}
              >
                {msg.content}
              </button>
            ) : (
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "aprendiz"
                    ? "rounded-tl-sm bg-muted"
                    : "rounded-tr-sm bg-primary text-primary-foreground",
                )}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {typing ? (
          <div className="flex gap-2">
            <AprendizAvatar size="sm" />
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}

        {sendingCode ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <Spinner />
            Enviando código…
          </div>
        ) : null}

        {submitting ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Spinner />
            Guardando o que aprendi…
          </div>
        ) : null}
      </div>

      <div className="border-t bg-background/80 p-3">
        {inputError ? (
          <p className="mb-2 text-xs text-destructive" role="alert">
            {inputError}
          </p>
        ) : null}

        {canGoBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={goBack}
          >
            <ArrowLeft className="size-3.5" />
            Voltar e corrigir resposta
          </Button>
        ) : null}

        {choiceOptions && !finished && !typing && !submitting ? (
          <div className="flex flex-wrap gap-2">
            {choiceOptions.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto whitespace-normal py-2 text-left"
                onClick={() => void handleChoice(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        ) : null}

        {showContinueInfo ? (
          <Button
            type="button"
            className="w-full"
            onClick={() => void goNext("welcome", "")}
          >
            Vamos começar
          </Button>
        ) : null}

        {showTextInput ? (
          <form onSubmit={(e) => void handleTextSubmit(e)} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) =>
                setInput(
                  step.kind === "code"
                    ? e.target.value.replace(/\D/g, "").slice(0, 6)
                    : e.target.value,
                )
              }
              placeholder={step.placeholder ?? "Sua resposta…"}
              type={step.kind === "email" ? "email" : "text"}
              inputMode={step.kind === "code" ? "numeric" : undefined}
              autoComplete={
                step.id === "email"
                  ? "email"
                  : step.id === "emailCode"
                    ? "one-time-code"
                    : "off"
              }
              disabled={submitting || sendingCode}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={submitting || sendingCode}
            >
              <Send className="size-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        ) : null}

        {currentStep === "emailCode" && !finished && !typing && !submitting ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            disabled={sendingCode}
            onClick={() => void resendCode()}
          >
            {sendingCode ? (
              <>
                <Spinner className="mr-2" />
                Reenviando…
              </>
            ) : (
              "Reenviar código"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated Use AprendizCadastroChat */
export const SignupChat = AprendizCadastroChat;
