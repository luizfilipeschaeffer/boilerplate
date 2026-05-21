"use client";

import type { CommsChannel, CommsThreadSummary } from "@boilerplate/db";
import { COMMS_CHANNEL_LABELS } from "@boilerplate/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createCommsThreadAction } from "./actions";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CHANNELS: CommsChannel[] = ["email", "whatsapp", "telegram"];

export function CommsInboxClient({
  threads,
  canEdit,
  filterOrgId,
  filterLeadId,
  organizations,
  leads,
}: {
  threads: CommsThreadSummary[];
  canEdit: boolean;
  filterOrgId?: string;
  filterLeadId?: string;
  organizations: { id: string; name: string }[];
  leads: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<CommsChannel>("email");
  const [body, setBody] = useState("");
  const [toLabel, setToLabel] = useState("");
  const [linkOrgId, setLinkOrgId] = useState(filterOrgId ?? "");
  const [linkLeadId, setLinkLeadId] = useState(filterLeadId ?? "");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (channelFilter === "all") return threads;
    return threads.filter((t) => t.channel === channelFilter);
  }, [threads, channelFilter]);

  const contextLabel =
    filterOrgId || filterLeadId
      ? "Filtrado pelo CRM"
      : "Todas as conversas";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setSaving(true);
    try {
      const threadId = await createCommsThreadAction({
        subject: subject.trim(),
        channel,
        organizationId: linkOrgId && linkOrgId !== "_none" ? linkOrgId : undefined,
        platformLeadId:
          linkLeadId && linkLeadId !== "_none" ? linkLeadId : undefined,
        initialBody: body.trim() || undefined,
        toLabel: toLabel.trim() || undefined,
        registerConsent: true,
      });
      setShowNew(false);
      setSubject("");
      setBody("");
      router.push(`/comms/${threadId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{contextLabel}</p>
          {(filterOrgId || filterLeadId) && (
            <Link
              href="/comms"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Limpar filtro
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={channelFilter}
            onValueChange={(v) => setChannelFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {COMMS_CHANNEL_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit ? (
            <Button type="button" onClick={() => setShowNew((v) => !v)}>
              {showNew ? "Cancelar" : "Nova conversa"}
            </Button>
          ) : null}
        </div>
      </div>

      {showNew && canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova conversa</CardTitle>
            <CardDescription>
              MVP com integrador e-mail mock (Resend). Mensagens ficam no schema
              global e geram atividade no CRM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={handleCreate}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label>Canal</Label>
                  <Select
                    value={channel}
                    onValueChange={(v) => {
                      if (v) setChannel(v as CommsChannel);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {COMMS_CHANNEL_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Destinatário (rótulo)</Label>
                  <Input
                    value={toLabel}
                    onChange={(e) => setToLabel(e.target.value)}
                    placeholder="nome@email.com"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Assunto</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label>Vincular organização</Label>
                  <Select
                    value={linkOrgId || "_none"}
                    onValueChange={(v) => setLinkOrgId(v === "_none" ? "" : (v ?? ""))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
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
                <div className="flex flex-col gap-1">
                  <Label>Vincular lead</Label>
                  <Select
                    value={linkLeadId || "_none"}
                    onValueChange={(v) => setLinkLeadId(v === "_none" ? "" : (v ?? ""))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
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
                {saving ? "Criando…" : "Criar thread"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inbox</CardTitle>
          <CardDescription>
            {filtered.length} thread(s) · integradores: email-resend-mock,
            social-whatsapp-mock
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa. Crie uma thread ou vincule pelo CRM.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/comms/${t.id}`}
                    className="flex flex-col gap-1 py-3 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.recordTitle ?? "Sem vínculo"} ·{" "}
                        {t.preview ?? "Sem mensagens"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {COMMS_CHANNEL_LABELS[t.channel]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t.messageCount} msg
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
