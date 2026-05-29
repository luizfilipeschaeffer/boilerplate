"use client";

import type { HelpdeskKbEntryDetail } from "@boilerplate/crm-helpdesk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addHelpdeskKbPostAction } from "@/app/actions/helpdesk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HelpdeskKbDetailClient({
  entry,
  canEdit,
}: {
  entry: HelpdeskKbEntryDetail;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [asSolution, setAsSolution] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/helpdesk/kb"
        className="inline-flex h-8 w-fit items-center rounded-lg border px-3 text-sm"
      >
        ← Base de conhecimento
      </Link>
      <h2 className="text-xl font-semibold">{entry.title}</h2>
      <p className="whitespace-pre-wrap text-sm">{entry.problemBody}</p>

      {entry.kind === "article" ? (
        <div className="flex flex-col gap-3">
          <h3 className="font-medium">Soluções</h3>
          {entry.solutions.map((s) => (
            <div key={s.id} className="rounded-md border p-3">
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="font-medium">Respostas</h3>
          {entry.posts.map((p) => (
            <div
              key={p.id}
              className={`rounded-md border p-3 ${p.isAcceptedSolution ? "border-green-600" : ""}`}
            >
              <p className="text-muted-foreground text-xs">
                {p.authorLabel}
                {p.isAcceptedSolution ? " · solução aceita" : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{p.body}</p>
            </div>
          ))}
          {canEdit ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                await addHelpdeskKbPostAction(entry.id, reply, asSolution);
                setReply("");
                setAsSolution(false);
                router.refresh();
              }}
            >
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Nova resposta…"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={asSolution}
                  onChange={(e) => setAsSolution(e.target.checked)}
                />
                Marcar como solução aceita
              </label>
              <Button type="submit" size="sm">
                Publicar resposta
              </Button>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
