"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User } from "lucide-react";

import { getMarketSegmentChoices } from "@/app/actions/market-segments";
import { submitOnboarding } from "@/app/actions/onboarding";
import { setMarketSegmentChoices } from "@/lib/diagnostico/segment-choices";
import { AprendizAvatar } from "@/components/aprendiz/aprendiz-avatar";
import { draftToOnboardingInput } from "@/lib/diagnostico/draft";
import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";
import {
  applyAnswer,
  formatUserAnswer,
  getStep,
  type OnboardingDraft,
  type OnboardingStepId,
} from "@/lib/onboarding-chat/steps";
import { validateAccessPassword } from "@/lib/onboarding-chat/validate-password";
import {
  getOnboardingStepRawValue,
  truncateMessagesToStep,
  type ChatMessage,
  type StepHistoryEntry,
} from "@/lib/chat/step-history";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function promptFor(stepId: OnboardingStepId, draft: OnboardingDraft): string {
  const step = getStep(stepId);
  return typeof step.prompt === "function" ? step.prompt(draft) : step.prompt;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initialWelcomeMessages(draft: OnboardingDraft): ChatMessage[] {
  const content = promptFor("welcome", draft);
  return [
    {
      id: "aprendiz-welcome",
      role: "aprendiz",
      content,
      stepId: "welcome",
    },
  ];
}

/** Onboarding conversacional com o Aprendiz (sem repetir o que já veio do cadastro). */
export function AprendizOnboardingChat({
  initialDraft,
  className,
}: {
  initialDraft: DiagnosticoDraft;
  className?: string;
}) {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [draft, setDraft] = React.useState<OnboardingDraft>(initialDraft);
  const [currentStep, setCurrentStep] =
    React.useState<OnboardingStepId>("welcome");
  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    initialWelcomeMessages(initialDraft),
  );
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [finished, setFinished] = React.useState(false);
  const [accessPassword, setAccessPassword] = React.useState("");
  const [accessPasswordConfirm, setAccessPasswordConfirm] = React.useState("");
  const [history, setHistory] = React.useState<
    StepHistoryEntry<OnboardingStepId, OnboardingDraft>[]
  >([]);
  const scrollToBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const pushMessage = React.useCallback(
    (role: ChatMessage["role"], content: string, stepId?: OnboardingStepId) => {
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

  async function showAprendiz(
    stepId: OnboardingStepId,
    nextDraft: OnboardingDraft,
  ) {
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
    if (step.kind === "text") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  React.useEffect(() => {
    if (currentStep !== "marketSegment" && currentStep !== "tipoNegocio") return;
    void getMarketSegmentChoices(draft.tipoNegocio).then((choices) => {
      setMarketSegmentChoices(choices);
    });
  }, [currentStep, draft.tipoNegocio]);

  const step = getStep(currentStep);
  const choiceOptions =
    step.kind === "choices"
      ? typeof step.choices === "function"
        ? step.choices(draft)
        : step.choices
      : undefined;

  async function finishOnboarding(
    finalDraft: OnboardingDraft,
    password: string,
  ) {
    setSubmitting(true);
    setFinished(true);
    try {
      const payload = draftToOnboardingInput(finalDraft);
      const result = await submitOnboarding({ ...payload, password });
      const res = await signIn("credentials", {
        email: payload.email,
        password,
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        pushMessage(
          "aprendiz",
          "Painel configurado! Entre de novo com seu e-mail para continuar.",
        );
        setSubmitting(false);
        setFinished(false);
        return;
      }
      if (result.requiresPaymentValidation) {
        router.push("/configuracoes/cobranca?primeiroAcesso=1");
      } else {
        router.push("/aprendiz?primeiroContato=1");
      }
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Não consegui concluir agora. Tente de novo.";
      pushMessage("aprendiz", msg);
      setSubmitting(false);
      setFinished(false);
    }
  }

  function recordAnswer(
    stepId: OnboardingStepId,
    draftBefore: OnboardingDraft,
    rawValue: string,
  ) {
    setHistory((prev) => [...prev, { stepId, draftBefore, rawValue }]);
  }

  function goBackToStep(targetStepId: OnboardingStepId) {
    if (submitting || typing) return;
    const entryIndex = history.findLastIndex((e) => e.stepId === targetStepId);
    if (entryIndex < 0) return;
    const entry = history[entryIndex];
    if (currentStep === "password") {
      setAccessPassword("");
      setAccessPasswordConfirm("");
    }
    setHistory((prev) => prev.slice(0, entryIndex));
    setMessages((prev) => truncateMessagesToStep(prev, targetStepId));
    setDraft(entry.draftBefore);
    setCurrentStep(targetStepId);
    const answered = applyAnswer(entry.stepId, entry.rawValue, entry.draftBefore);
    setInput(getOnboardingStepRawValue(entry.stepId, answered));
    setInputError(null);
    setFinished(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function goBack() {
    if (history.length === 0) return;
    goBackToStep(history[history.length - 1].stepId);
  }

  async function goNext(stepId: OnboardingStepId, rawValue: string) {
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
    const nextDraft = applyAnswer(stepId, rawValue, draft);
    const display = formatUserAnswer(stepId, rawValue, draft);
    if (display) pushMessage("user", display, stepId);
    recordAnswer(stepId, draftBefore, rawValue);

    setDraft(nextDraft);
    setInput("");

    const nextId = stepDef.next(nextDraft);
    if (!nextId) return;

    if (nextId === "summary") {
      return;
    }

    setCurrentStep(nextId);
    await showAprendiz(nextId, nextDraft);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (typing || submitting || finished || currentStep !== "password") return;

    const err = validateAccessPassword(accessPassword, accessPasswordConfirm);
    if (err) {
      setInputError(err);
      return;
    }
    setInputError(null);

    const draftBefore = draft;
    pushMessage("user", formatUserAnswer("password", "", draft), "password");
    recordAnswer("password", draftBefore, "ok");

    setCurrentStep("summary");
    await showAprendiz("summary", draft);
    await finishOnboarding(draft, accessPassword);
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
    if (!value && currentStep !== "cnpj") return;
    await goNext(currentStep, value || "pular");
  }

  async function handleChoice(value: string) {
    if (typing || submitting) return;
    await goNext(currentStep, value);
  }

  const showTextInput =
    !finished &&
    !typing &&
    step.kind === "text" &&
    currentStep !== "summary";

  const showPasswordSetup =
    !finished && !typing && !submitting && step.kind === "password";

  const showContinueInfo =
    !finished && !typing && step.kind === "info" && currentStep === "welcome";

  const canGoBack =
    history.length > 0 &&
    !finished &&
    !submitting &&
    !typing &&
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
            Configurando seu negócio
          </p>
        </div>
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
                onClick={() => goBackToStep(msg.stepId as OnboardingStepId)}
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

        {submitting ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Spinner />
            Montando seu painel…
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
            Vamos lá
          </Button>
        ) : null}

        {showPasswordSetup ? (
          <form
            onSubmit={(e) => void handlePasswordSubmit(e)}
            className="flex flex-col gap-3"
          >
            <Field>
              <FieldLabel htmlFor="onboarding-password">Senha de acesso</FieldLabel>
              <Input
                id="onboarding-password"
                type="password"
                autoComplete="new-password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={submitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-password-confirm">
                Confirmar senha
              </FieldLabel>
              <Input
                id="onboarding-password-confirm"
                type="password"
                autoComplete="new-password"
                value={accessPasswordConfirm}
                onChange={(e) => setAccessPasswordConfirm(e.target.value)}
                placeholder="Repita a senha"
                disabled={submitting}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="mr-2" />
                  Configurando painel…
                </>
              ) : (
                "Criar senha e concluir"
              )}
            </Button>
          </form>
        ) : null}

        {showTextInput ? (
          <form onSubmit={(e) => void handleTextSubmit(e)} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={step.placeholder ?? "Sua resposta…"}
              disabled={submitting}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={submitting}>
              <Send className="size-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
