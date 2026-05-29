"use client";

import type { HelpdeskKbEntrySummary } from "@boilerplate/crm-helpdesk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createHelpdeskKbArticleAction,
  createHelpdeskKbThreadAction,
} from "@/app/actions/helpdesk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HelpdeskKbListClient({
  entries,
  canEdit,
}: {
  entries: HelpdeskKbEntrySummary[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"article" | "thread" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/helpdesk"
          className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm"
        >
          Voltar aos tickets
        </Link>
        {canEdit ? (
          <>
            <Button variant={mode === "article" ? "default" : "outline"} onClick={() => setMode("article")}>
              Novo artigo
            </Button>
            <Button variant={mode === "thread" ? "default" : "outline"} onClick={() => setMode("thread")}>
              Nova thread
            </Button>
          </>
        ) : null}
      </div>

      {mode && canEdit ? (
        <form
          className="grid gap-2 rounded-lg border p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const id =
                mode === "article"
                  ? await createHelpdeskKbArticleAction({
                      title,
                      problemBody: body,
                      publish: true,
                    })
                  : await createHelpdeskKbThreadAction({
                      title,
                      problemBody: body,
                      publish: true,
                    });
              setMode(null);
              setTitle("");
              setBody("");
              router.push(`/helpdesk/kb/${id}`);
            } finally {
              setSaving(false);
            }
          }}
        >
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Label>Problema / post inicial</Label>
          <Input value={body} onChange={(e) => setBody(e.target.value)} required />
          <Button type="submit" disabled={saving}>
            Publicar
          </Button>
        </form>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Solução</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <Link href={`/helpdesk/kb/${e.id}`} className="font-medium underline">
                  {e.title}
                </Link>
              </TableCell>
              <TableCell>{e.kind === "article" ? "Artigo" : "Thread"}</TableCell>
              <TableCell>{e.status}</TableCell>
              <TableCell>{e.hasAcceptedSolution ? "Sim" : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
