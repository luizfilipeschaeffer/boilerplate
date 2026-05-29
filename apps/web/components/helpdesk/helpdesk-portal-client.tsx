"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createHelpdeskTicketAction,
  helpdeskAprendizReplyAction,
  suggestHelpdeskKbAction,
} from "@/app/actions/helpdesk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HelpdeskPortalClient({
  canEdit,
  sectorId,
}: {
  canEdit: boolean;
  sectorId: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h2 className="text-lg font-semibold">Como posso ajudar?</h2>
      <p className="text-muted-foreground text-sm">
        Descreva o problema — consulto a base de conhecimento antes de abrir um ticket.
      </p>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ex.: não consigo acessar o e-mail corporativo"
      />
      <Button
        type="button"
        onClick={async () => {
          const res = await helpdeskAprendizReplyAction(query, sectorId);
          setReply(res.reply);
          if (res.hits.length > 0) {
            const suggested = await suggestHelpdeskKbAction(
              query,
              query,
              sectorId,
            );
            if (suggested.length === 0) return;
          }
        }}
      >
        Perguntar ao Aprendiz
      </Button>
      {reply ? (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
          {reply}
        </div>
      ) : null}
      {canEdit ? (
        <>
          <Button
            variant="outline"
            onClick={() => setShowTicketForm((v) => !v)}
          >
            {showTicketForm ? "Cancelar ticket" : "Abrir ticket"}
          </Button>
          {showTicketForm ? (
            <form
              className="grid gap-2 rounded-lg border p-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const id = await createHelpdeskTicketAction({
                  title,
                  description: description || query,
                });
                router.push(`/helpdesk/tickets/${id}`);
              }}
            >
              <Label>Título do ticket</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Label>Detalhes</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit">Criar ticket</Button>
            </form>
          ) : null}
        </>
      ) : null}
      <Link href="/helpdesk" className="text-primary text-sm underline">
        Ver todos os tickets
      </Link>
    </div>
  );
}
