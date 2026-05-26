"use client";

import type { HelpdeskTicketDetail } from "@boilerplate/crm-helpdesk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addHelpdeskCommentAction,
  helpdeskAprendizReplyAction,
  linkHelpdeskKbAction,
  searchHelpdeskKbAction,
  submitHelpdeskCsatAction,
  updateHelpdeskTicketAction,
} from "@/app/actions/helpdesk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HelpdeskTicketClient({
  ticket,
  canEdit,
  members,
}: {
  ticket: HelpdeskTicketDetail;
  canEdit: boolean;
  members: { membershipId: string; name: string }[];
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotReply, setCopilotReply] = useState<string | null>(null);
  const [kbSearch, setKbSearch] = useState("");
  const [kbHits, setKbHits] = useState<
    { kbEntryId: string; title: string; snippet: string }[]
  >([]);
  const [csatScore, setCsatScore] = useState("5");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div>
          <p className="text-muted-foreground text-sm">
            Ticket #{ticket.number}
            {ticket.slaBreached ? (
              <Badge variant="destructive" className="ml-2">
                SLA estourado
              </Badge>
            ) : null}
          </p>
          <h2 className="text-xl font-semibold">{ticket.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{ticket.description}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Comentários</h3>
          {ticket.comments.map((c) => (
            <div key={c.id} className="rounded-md border p-3 text-sm">
              <p className="text-muted-foreground text-xs">
                {c.authorLabel} · {c.visibility} ·{" "}
                {new Date(c.createdAt).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          {canEdit ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                setBusy(true);
                try {
                  await addHelpdeskCommentAction(ticket.id, comment, "requester");
                  setComment("");
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Responder ao solicitante…"
              />
              <Button type="submit" size="sm" disabled={busy}>
                Enviar
              </Button>
            </form>
          ) : null}
        </div>

        {ticket.status === "closed" ? (
          <form
            className="rounded-md border p-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await submitHelpdeskCsatAction(
                  ticket.id,
                  Number(csatScore),
                );
                await refresh();
              } finally {
                setBusy(false);
              }
            }}
          >
            <Label>CSAT (1–5)</Label>
            <Select
              value={csatScore}
              onValueChange={(v) => setCsatScore(v ?? "5")}
            >
              <SelectTrigger className="mt-1 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" className="mt-2">
              Enviar avaliação
            </Button>
          </form>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {canEdit ? (
          <>
            <div className="rounded-lg border p-3">
              <h3 className="mb-2 font-medium">Atribuição</h3>
              <Select
                value={ticket.assigneeMembershipId ?? "_none"}
                onValueChange={async (v) => {
                  if (!v) return;
                  await updateHelpdeskTicketAction(ticket.id, {
                    assigneeMembershipId: v === "_none" ? null : v,
                  });
                  await refresh();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Atendente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sem atendente</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.membershipId} value={m.membershipId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            <Select
              value={ticket.status}
              onValueChange={async (v) => {
                if (!v) return;
                  await updateHelpdeskTicketAction(ticket.id, {
                    status: v as HelpdeskTicketDetail["status"],
                  });
                  await refresh();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="waiting_requester">
                    Aguardando solicitante
                  </SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="mb-2 font-medium">Copiloto Aprendiz</h3>
              <Input
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Buscar na base…"
              />
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={async () => {
                  const res = await helpdeskAprendizReplyAction(
                    copilotQuery,
                    ticket.affectedSectorId,
                  );
                  setCopilotReply(res.reply);
                  setKbHits(res.hits);
                }}
              >
                Consultar KB
              </Button>
              {copilotReply ? (
                <p className="mt-2 whitespace-pre-wrap text-sm">{copilotReply}</p>
              ) : null}
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="mb-2 font-medium">Vincular KB</h3>
              <Input
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                placeholder="Buscar artigo…"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={async () => {
                  const hits = await searchHelpdeskKbAction(
                    kbSearch,
                    ticket.affectedSectorId,
                  );
                  setKbHits(hits);
                }}
              >
                Buscar
              </Button>
              <ul className="mt-2 space-y-1 text-sm">
                {kbHits.map((h) => (
                  <li key={h.kbEntryId} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/helpdesk/kb/${h.kbEntryId}`}
                      className="underline"
                    >
                      {h.title}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await linkHelpdeskKbAction(ticket.id, [h.kbEntryId]);
                        await refresh();
                      }}
                    >
                      Vincular
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        <div className="rounded-lg border p-3">
          <h3 className="mb-2 font-medium">Artigos vinculados</h3>
          {ticket.kbLinks.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {ticket.kbLinks.map((l) => (
                <li key={l.kbEntryId}>
                  <Link href={`/helpdesk/kb/${l.kbEntryId}`} className="underline">
                    {l.title}
                  </Link>{" "}
                  <span className="text-muted-foreground">({l.linkType})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          Solicitante: {ticket.requesterLabel ?? "—"} · Setor:{" "}
          {ticket.affectedSectorName ?? "—"}
        </p>
      </div>
    </div>
  );
}
