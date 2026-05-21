"use client";

import * as React from "react";
import { Send, User } from "lucide-react";

import {
  loadAprendizChatAction,
  sendAprendizChatMessageAction,
  toggleAprendizChatAutomationAction,
} from "@/app/actions/aprendiz";
import { AprendizChatAutomations } from "@/components/aprendiz/aprendiz-chat-automations";
import { AprendizAvatar } from "@/components/aprendiz/aprendiz-avatar";
import { MissionVisitTracker } from "@/components/mission-visit-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  isAutomationsPanelMessage,
  type AprendizChatMessageDto,
} from "@/lib/aprendiz-chat/types";
import { cn } from "@/lib/utils";

function formatMessageContent(content: string): React.ReactNode {
  const parts = content.split("\n");
  if (parts.length === 1) return content;
  return parts.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 ? <br /> : null}
      {line}
    </React.Fragment>
  ));
}

export function AprendizDashboardChat({
  primeiroContato,
}: {
  primeiroContato: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [messages, setMessages] = React.useState<AprendizChatMessageDto[]>([]);
  const [templates, setTemplates] = React.useState<
    Awaited<ReturnType<typeof loadAprendizChatAction>>["templates"]
  >([]);
  const loadKey = String(primeiroContato);
  const [loading, setLoading] = React.useState(true);
  const [prevLoadKey, setPrevLoadKey] = React.useState(loadKey);
  const [typing, setTyping] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [togglingAutomation, setTogglingAutomation] = React.useState(false);

  const scrollToBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  if (loadKey !== prevLoadKey) {
    setPrevLoadKey(loadKey);
    setLoading(true);
    setMessages([]);
    setTemplates([]);
  }

  React.useEffect(() => {
    let cancelled = false;
    void loadAprendizChatAction({ primeiroContato }).then((data) => {
      if (cancelled) return;
      setMessages(data.messages);
      setTemplates(data.templates);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [primeiroContato]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || typing) return;

    setSending(true);
    setInput("");
    setTyping(true);
    try {
      const next = await sendAprendizChatMessageAction(text);
      setMessages(next);
    } finally {
      setTyping(false);
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleAutomationUpdated(
    data: Awaited<ReturnType<typeof toggleAprendizChatAutomationAction>>,
  ) {
    setMessages(data.messages);
    setTemplates(data.templates);
    scrollToBottom();
  }

  const busy = sending || typing || togglingAutomation;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-8 lg:px-6">
      <MissionVisitTracker missionId="conhecer_aprendiz" />
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
          "mx-auto w-full max-w-2xl",
        )}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <AprendizAvatar size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none">Aprendiz</p>
            <p className="truncate text-xs text-muted-foreground">
              Seu assistente no dia a dia do negócio
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-5" />
            Carregando conversa…
          </div>
        ) : (
          <>
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
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      msg.role === "aprendiz"
                        ? "rounded-tl-sm bg-muted"
                        : "rounded-tr-sm bg-primary text-primary-foreground",
                    )}
                  >
                    {formatMessageContent(msg.content)}
                    {isAutomationsPanelMessage(msg.meta) ? (
                      <AprendizChatAutomations
                        templates={templates}
                        disabled={busy}
                        onPendingChange={setTogglingAutomation}
                        onUpdated={handleAutomationUpdated}
                      />
                    ) : null}
                  </div>
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
            </div>

            <div className="border-t bg-background/80 p-3">
              <form
                onSubmit={(e) => void handleSend(e)}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte sobre vendas, estoque, clientes…"
                  disabled={busy}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                  <Send className="size-4" />
                  <span className="sr-only">Enviar</span>
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
