"use client";

import type { CommsThreadDetail, CommsThreadSummary } from "@boilerplate/db";
import {
  COMMS_CHANNEL_LABELS,
  COMMS_PARTICIPANT_LABELS,
  type CommsChannel,
  type CommsParticipantKind,
} from "@boilerplate/db/platform-comms-labels";
import { formatTipoNegocio } from "@boilerplate/crm";
import {
  Building2,
  MessageSquarePlus,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createCommsThreadAction, sendCommsMessageAction } from "./actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_ROLE_LABELS } from "@/lib/rbac";
import type { PlatformRole } from "@boilerplate/db";
import { cn } from "@/lib/utils";

const CLIENT_CHANNELS: CommsChannel[] = ["whatsapp", "telegram", "email"];

type InboxFilter =
  | "all"
  | "clients"
  | "internal"
  | "whatsapp"
  | "telegram"
  | "email";

type PlatformUserOption = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function threadDisplayName(t: CommsThreadSummary) {
  return t.recordTitle ?? t.subject;
}

const SELECT_TRIGGER_IN_FORM =
  "w-full min-w-0 max-w-full [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate";

function selectFieldLabel(
  id: string,
  placeholder: string,
  labels: Map<string, string>,
  fallback = "Selecionado",
): string {
  if (!id || id === "_none") return placeholder;
  return labels.get(id) ?? fallback;
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
      )}
    >
      {children}
    </button>
  );
}

export function CommsWorkspace({
  threads,
  activeThread,
  canEdit,
  currentUserId,
  filterOrgId,
  filterLeadId,
  organizations,
  leads,
  platformUsers,
}: {
  threads: CommsThreadSummary[];
  activeThread: CommsThreadDetail | null;
  canEdit: boolean;
  currentUserId?: string;
  filterOrgId?: string;
  filterLeadId?: string;
  organizations: { id: string; name: string }[];
  leads: { id: string; name: string }[];
  platformUsers: PlatformUserOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [showNew, setShowNew] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat" | "details">(
    activeThread ? "chat" : "list",
  );
  const [showDetails, setShowDetails] = useState(true);

  const [newTab, setNewTab] = useState<"client" | "internal">("client");
  const [channel, setChannel] = useState<CommsChannel>("whatsapp");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toLabel, setToLabel] = useState("");
  const [linkOrgId, setLinkOrgId] = useState(filterOrgId ?? "");
  const [linkLeadId, setLinkLeadId] = useState(filterLeadId ?? "");
  const [peerUserId, setPeerUserId] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [saving, setSaving] = useState(false);

  const organizationLabelById = useMemo(
    () => new Map(organizations.map((o) => [o.id, o.name])),
    [organizations],
  );
  const leadLabelById = useMemo(
    () => new Map(leads.map((l) => [l.id, l.name])),
    [leads],
  );
  const platformUserLabelById = useMemo(
    () =>
      new Map(
        platformUsers.map((u) => [
          u.id,
          `${u.name?.trim() || u.email} · ${
            PLATFORM_ROLE_LABELS[u.role as PlatformRole] ?? u.role
          }`,
        ]),
      ),
    [platformUsers],
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (inboxFilter === "clients" && t.participantKind !== "client") {
        return false;
      }
      if (inboxFilter === "internal" && t.participantKind !== "internal") {
        return false;
      }
      if (
        inboxFilter !== "all" &&
        inboxFilter !== "clients" &&
        inboxFilter !== "internal" &&
        t.channel !== inboxFilter
      ) {
        return false;
      }
      if (!q) return true;
      const hay = [
        t.subject,
        t.recordTitle,
        t.preview,
        t.peerName,
        t.peerEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [threads, search, inboxFilter]);

  const activeId = activeThread?.id;

  function openThread(id: string) {
    router.push(`/comms/${id}`);
    setMobilePanel("chat");
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setSaving(true);
    try {
      const threadId = await createCommsThreadAction({
        subject: subject.trim(),
        channel,
        participantKind: "client",
        organizationId: linkOrgId && linkOrgId !== "_none" ? linkOrgId : undefined,
        platformLeadId:
          linkLeadId && linkLeadId !== "_none" ? linkLeadId : undefined,
        initialBody: body.trim() || undefined,
        toLabel: toLabel.trim() || undefined,
        registerConsent: true,
      });
      setShowNew(false);
      resetNewForm();
      openThread(threadId);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInternal(e: React.FormEvent) {
    e.preventDefault();
    if (!peerUserId) return;
    const peer = platformUsers.find((u) => u.id === peerUserId);
    if (!peer) return;
    const title = peer.name?.trim() || peer.email;
    setSaving(true);
    try {
      const threadId = await createCommsThreadAction({
        subject: title,
        channel: "internal",
        participantKind: "internal",
        peerPlatformUserId: peer.id,
        initialBody: body.trim() || undefined,
        registerConsent: false,
      });
      setShowNew(false);
      resetNewForm();
      openThread(threadId);
    } finally {
      setSaving(false);
    }
  }

  function resetNewForm() {
    setSubject("");
    setBody("");
    setToLabel("");
    setPeerUserId("");
    setNewTab("client");
    setChannel("whatsapp");
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Coluna esquerda — lista (estilo WhatsApp) */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r bg-muted/20 md:w-[340px] lg:w-[380px]",
          mobilePanel !== "list" && activeId && "hidden md:flex",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Comunicação</h1>
            <p className="text-xs text-muted-foreground">
              Omnichannel · clientes e equipe
            </p>
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Nova conversa"
              onClick={() => setShowNew(true)}
            >
              <MessageSquarePlus className="size-5" />
            </Button>
          ) : null}
        </div>

        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar conversas…"
              className="h-9 bg-background pl-8"
            />
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            <FilterPill
              active={inboxFilter === "all"}
              onClick={() => setInboxFilter("all")}
            >
              Tudo
            </FilterPill>
            <FilterPill
              active={inboxFilter === "clients"}
              onClick={() => setInboxFilter("clients")}
            >
              Clientes
            </FilterPill>
            <FilterPill
              active={inboxFilter === "internal"}
              onClick={() => setInboxFilter("internal")}
            >
              Equipe
            </FilterPill>
            <FilterPill
              active={inboxFilter === "whatsapp"}
              onClick={() => setInboxFilter("whatsapp")}
            >
              WhatsApp
            </FilterPill>
            <FilterPill
              active={inboxFilter === "telegram"}
              onClick={() => setInboxFilter("telegram")}
            >
              Telegram
            </FilterPill>
            <FilterPill
              active={inboxFilter === "email"}
              onClick={() => setInboxFilter("email")}
            >
              E-mail
            </FilterPill>
          </div>
          {(filterOrgId || filterLeadId) && (
            <Link
              href="/comms"
              className="mt-1 inline-block text-xs text-primary hover:underline"
            >
              Limpar filtro CRM
            </Link>
          )}
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma conversa. Inicie com um cliente ou membro da equipe.
            </li>
          ) : (
            filteredThreads.map((t) => {
              const selected = t.id === activeId;
              const name = threadDisplayName(t);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/60",
                      selected && "bg-muted",
                    )}
                  >
                    <Avatar size="default">
                      <AvatarFallback className="text-xs">
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{name}</span>
                        {t.lastMessageAt ? (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(t.lastMessageAt).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "2-digit" },
                            )}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.preview ?? t.subject}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {COMMS_CHANNEL_LABELS[t.channel]}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {COMMS_PARTICIPANT_LABELS[t.participantKind]}
                        </Badge>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {/* Coluna central — conversa */}
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-background",
          mobilePanel !== "chat" && activeId && "hidden md:flex",
          !activeId && "hidden md:flex",
        )}
      >
        {!activeThread ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
            <MessageSquarePlus className="size-12 opacity-30" />
            <p className="text-sm font-medium text-foreground">
              Selecione uma conversa
            </p>
            <p className="max-w-sm text-xs">
              Inbox unificado: chat interno com a equipe da plataforma e canais
              externos (WhatsApp, Telegram, e-mail) com clientes e leads.
            </p>
            {canEdit ? (
              <Button type="button" size="sm" onClick={() => setShowNew(true)}>
                Nova conversa
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobilePanel("list")}
                aria-label="Voltar à lista"
              >
                ←
              </Button>
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">
                  {initials(threadDisplayName(activeThread))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {threadDisplayName(activeThread)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {COMMS_CHANNEL_LABELS[activeThread.channel]} ·{" "}
                  {COMMS_PARTICIPANT_LABELS[activeThread.participantKind]}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? "Ocultar dados" : "Dados do contato"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setMobilePanel("details")}
                aria-label="Dados do contato"
              >
                <Users className="size-4" />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted/10 px-4 py-4">
              {activeThread.messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Sem mensagens. Envie a primeira abaixo.
                </p>
              ) : (
                activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      m.direction === "outbound"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-card border",
                    )}
                  >
                    <p className="text-[10px] opacity-80">
                      {m.fromLabel ??
                        (m.direction === "outbound" ? "Você" : "Contato")}
                    </p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))
              )}
            </div>

            {canEdit ? (
              <form
                className="flex items-end gap-2 border-t bg-card px-4 py-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!replyBody.trim()) return;
                  setSaving(true);
                  try {
                    await sendCommsMessageAction(
                      activeThread.id,
                      replyBody.trim(),
                    );
                    setReplyBody("");
                    router.refresh();
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Digite uma mensagem…"
                  rows={1}
                  className="min-h-9 resize-none"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={saving || !replyBody.trim()}
                  aria-label="Enviar"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            ) : null}
          </>
        )}
      </section>

      {/* Coluna direita — dados do contato */}
      {activeThread && showDetails ? (
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-l bg-muted/10 md:w-[300px] lg:w-[340px]",
            mobilePanel !== "details" && "hidden lg:flex",
            mobilePanel === "details" && "flex lg:flex",
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Dados do contato</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setShowDetails(false);
                setMobilePanel("chat");
              }}
              aria-label="Fechar painel"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 text-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <Avatar size="lg">
                <AvatarFallback>
                  {initials(threadDisplayName(activeThread))}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium">{threadDisplayName(activeThread)}</p>
              <Badge variant="outline">
                {COMMS_CHANNEL_LABELS[activeThread.channel]}
              </Badge>
            </div>

            {activeThread.participantKind === "internal" ? (
              <div className="space-y-2 rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" />
                  <span className="text-xs font-medium uppercase">
                    Membro da equipe
                  </span>
                </div>
                <p>{activeThread.peerName ?? activeThread.peerEmail}</p>
                {activeThread.peerEmail ? (
                  <p className="text-xs text-muted-foreground">
                    {activeThread.peerEmail}
                  </p>
                ) : null}
                {activeThread.peerRole ? (
                  <p className="text-xs">
                    {PLATFORM_ROLE_LABELS[
                      activeThread.peerRole as PlatformRole
                    ] ?? activeThread.peerRole}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4" />
                  <span className="text-xs font-medium uppercase">Cliente</span>
                </div>
                <p>{activeThread.recordTitle ?? "Sem vínculo CRM"}</p>
                {activeThread.tipoNegocio ? (
                  <p className="text-xs text-muted-foreground">
                    {formatTipoNegocio(activeThread.tipoNegocio)}
                    {activeThread.phase != null
                      ? ` · Fase ${activeThread.phase}`
                      : ""}
                  </p>
                ) : null}
                {(activeThread.organizationId ||
                  activeThread.platformLeadId) && (
                  <Link
                    href={
                      activeThread.organizationId
                        ? `/comms?organizationId=${activeThread.organizationId}`
                        : `/comms?platformLeadId=${activeThread.platformLeadId}`
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    Ver conversas deste registro
                  </Link>
                )}
              </div>
            )}

            {activeThread.consents.length > 0 ? (
              <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">LGPD</p>
                {activeThread.consents
                  .map(
                    (c) =>
                      `${c.channel} (${new Date(c.consentedAt).toLocaleDateString("pt-BR")})`,
                  )
                  .join(", ")}
              </div>
            ) : null}

            <p className="text-[10px] text-muted-foreground">
              {activeThread.messageCount} mensagem(ns) · integradores mock
            </p>
          </div>
        </aside>
      ) : null}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
            <DialogDescription>
              Cliente (omnichannel externo) ou membro da equipe (chat interno,
              qualquer setor/papel).
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={newTab}
            onValueChange={(v) => setNewTab((v as "client" | "internal") ?? "client")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="client" className="flex-1">
                Cliente
              </TabsTrigger>
              <TabsTrigger value="internal" className="flex-1">
                Equipe interna
              </TabsTrigger>
            </TabsList>
            <TabsContent value="client" className="mt-4 min-w-0">
              <form
                className="flex min-w-0 flex-col gap-3"
                onSubmit={handleCreateClient}
              >
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Label>Canal</Label>
                    <Select
                      value={channel}
                      onValueChange={(v) => {
                        if (v) setChannel(v as CommsChannel);
                      }}
                    >
                      <SelectTrigger className={SELECT_TRIGGER_IN_FORM}>
                        <SelectValue>
                          {COMMS_CHANNEL_LABELS[channel]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_CHANNELS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {COMMS_CHANNEL_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <Label>Destinatário</Label>
                    <Input
                      value={toLabel}
                      onChange={(e) => setToLabel(e.target.value)}
                      placeholder="nome@email.com ou +55…"
                      className="w-full min-w-0"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <Label>Assunto</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Label>Organização (tenant)</Label>
                    <Select
                      value={linkOrgId || "_none"}
                      onValueChange={(v) =>
                        setLinkOrgId(v === "_none" ? "" : (v ?? ""))
                      }
                    >
                      <SelectTrigger className={SELECT_TRIGGER_IN_FORM}>
                        <SelectValue>
                          {selectFieldLabel(
                            linkOrgId,
                            "Nenhuma",
                            organizationLabelById,
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhuma</SelectItem>
                        {organizations.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <Label>Lead</Label>
                    <Select
                      value={linkLeadId || "_none"}
                      onValueChange={(v) =>
                        setLinkLeadId(v === "_none" ? "" : (v ?? ""))
                      }
                    >
                      <SelectTrigger className={SELECT_TRIGGER_IN_FORM}>
                        <SelectValue>
                          {selectFieldLabel(
                            linkLeadId,
                            "Nenhum",
                            leadLabelById,
                            "Lead selecionado",
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhum</SelectItem>
                        {leads.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Primeira mensagem</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Criando…" : "Iniciar conversa"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="internal" className="mt-4 min-w-0">
              <form
                className="flex min-w-0 flex-col gap-3"
                onSubmit={handleCreateInternal}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <Label>Membro da equipe</Label>
                  <Select
                    value={peerUserId || "_none"}
                    onValueChange={(v) =>
                      setPeerUserId(v === "_none" ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger className={SELECT_TRIGGER_IN_FORM}>
                      <SelectValue>
                        {selectFieldLabel(
                          peerUserId,
                          "Selecione…",
                          platformUserLabelById,
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none" disabled>
                        Selecione…
                      </SelectItem>
                      {platformUsers
                        .filter((u) => u.id !== currentUserId)
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name?.trim() || u.email} ·{" "}
                            {PLATFORM_ROLE_LABELS[u.role as PlatformRole] ??
                              u.role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Mensagem</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    placeholder="Olá…"
                  />
                </div>
                <Button type="submit" disabled={saving || !peerUserId}>
                  {saving ? "Abrindo…" : "Abrir chat interno"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
