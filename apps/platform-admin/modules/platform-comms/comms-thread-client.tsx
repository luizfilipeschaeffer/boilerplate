"use client";

import type { CommsThreadDetail } from "@boilerplate/db";
import { COMMS_CHANNEL_LABELS } from "@boilerplate/db/platform-comms-labels";
import { activityTypeLabel } from "@boilerplate/db/platform-crm-ext-labels";
import Link from "next/link";
import { useState } from "react";
import { createTicketFromCommsThreadAction } from "@/app/actions/helpdesk";
import { sendCommsMessageAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatTipoNegocio } from "@boilerplate/crm";

export function CommsThreadClient({
  thread,
  canEdit,
}: {
  thread: CommsThreadDetail;
  canEdit: boolean;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [ticketSaving, setTicketSaving] = useState(false);

  const crmHref = thread.organizationId
    ? `/crm?view=list`
    : thread.platformLeadId
      ? `/crm?view=list`
      : null;

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/comms" className="text-primary hover:underline">
          ← Inbox
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{thread.subject}</CardTitle>
              <CardDescription>
                {COMMS_CHANNEL_LABELS[thread.channel]} ·{" "}
                {thread.recordTitle ?? "Sem vínculo CRM"}
              </CardDescription>
            </div>
            <Badge variant="outline">{thread.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {thread.tipoNegocio ? (
            <p>
              <span className="text-muted-foreground">Diagnóstico: </span>
              {formatTipoNegocio(thread.tipoNegocio)}
              {thread.phase != null ? ` · Fase ${thread.phase}` : ""}
            </p>
          ) : null}
          {thread.consents.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Consentimento LGPD:{" "}
              {thread.consents
                .map(
                  (c) =>
                    `${c.channel} (${new Date(c.consentedAt).toLocaleDateString("pt-BR")})`,
                )
                .join(", ")}
            </p>
          ) : null}
          {crmHref && thread.recordTitle ? (
            <Link
              href={
                thread.organizationId
                  ? `/comms?organizationId=${thread.organizationId}`
                  : `/comms?platformLeadId=${thread.platformLeadId}`
              }
              className="text-primary text-xs hover:underline"
            >
              Ver todas as conversas de {thread.recordTitle}
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {thread.organizationId && canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Help Desk</CardTitle>
            <CardDescription>
              {thread.helpdeskTicketId
                ? `Ticket vinculado: ${thread.helpdeskTicketId}`
                : "Criar ticket de suporte no tenant da organização."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {thread.helpdeskTicketId ? (
              <Link href="/helpdesk" className="text-primary text-sm hover:underline">
                Ver agregado Help Desk
              </Link>
            ) : (
              <Button
                type="button"
                disabled={ticketSaving}
                onClick={async () => {
                  setTicketSaving(true);
                  try {
                    const preview =
                      thread.messages.at(-1)?.body?.slice(0, 500) ?? "";
                    await createTicketFromCommsThreadAction(
                      thread.id,
                      thread.subject,
                      preview || thread.subject,
                    );
                  } finally {
                    setTicketSaving(false);
                  }
                }}
              >
                {ticketSaving ? "Criando…" : "Criar ticket a partir desta thread"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens</CardTitle>
        </CardHeader>
        <CardContent className="flex max-h-[420px] flex-col gap-3 overflow-y-auto">
          {thread.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem mensagens.</p>
          ) : (
            thread.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.direction === "outbound"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-xs opacity-80">
                  {m.fromLabel ?? (m.direction === "outbound" ? "Você" : "Cliente")}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">
                  {new Date(m.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Responder (mock)</CardTitle>
            <CardDescription>
              Registra mensagem outbound e atividade tipo{" "}
              {activityTypeLabel("message")} no CRM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!body.trim()) return;
                setSaving(true);
                try {
                  await sendCommsMessageAction(thread.id, body.trim());
                  setBody("");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Sua resposta…"
              />
              <Button type="submit" disabled={saving}>
                Enviar
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
