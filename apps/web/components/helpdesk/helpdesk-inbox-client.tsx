"use client";

import type {
  HelpdeskQueue,
  HelpdeskTicketStatus,
  HelpdeskTicketSummary,
} from "@boilerplate/crm-helpdesk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createHelpdeskTicketAction } from "@/app/actions/helpdesk";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<HelpdeskTicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  waiting_requester: "Aguardando solicitante",
  resolved: "Resolvido",
  closed: "Fechado",
};

export function HelpdeskInboxClient({
  tickets,
  queues,
  canEdit,
}: {
  tickets: HelpdeskTicketSummary[];
  queues: HelpdeskQueue[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const id = await createHelpdeskTicketAction({
        title: title.trim(),
        description: description.trim(),
        priority: priority as "low" | "medium" | "high" | "urgent",
      });
      setShowNew(false);
      setTitle("");
      setDescription("");
      router.push(`/helpdesk/tickets/${id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link
            href="/helpdesk/kb"
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm"
          >
            Base de conhecimento
          </Link>
          <Link
            href="/helpdesk/portal"
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm"
          >
            Portal de suporte
          </Link>
        </div>
        {canEdit ? (
          <Button onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancelar" : "Novo ticket"}
          </Button>
        ) : null}
      </div>

      {showNew && canEdit ? (
        <form
          onSubmit={handleCreate}
          className="grid gap-3 rounded-lg border p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <Label htmlFor="hd-title">Título</Label>
            <Input
              id="hd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="hd-desc">Descrição</Label>
            <Input
              id="hd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v ?? "medium")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Criando…" : "Criar ticket"}
            </Button>
          </div>
        </form>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fila</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Atendente</TableHead>
            <TableHead>SLA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                Nenhum ticket encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((t) => (
              <TableRow
                key={t.id}
                className="cursor-pointer"
                onClick={() => router.push(`/helpdesk/tickets/${t.id}`)}
              >
                <TableCell>{t.number}</TableCell>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {STATUS_LABELS[t.status]}
                  </Badge>
                </TableCell>
                <TableCell>{t.queueName ?? "—"}</TableCell>
                <TableCell>
                  {t.requesterLabel ?? t.affectedSectorName ?? "Setor"}
                </TableCell>
                <TableCell>{t.assigneeLabel ?? "—"}</TableCell>
                <TableCell>
                  {t.slaBreached ? (
                    <Badge variant="destructive">Estourado</Badge>
                  ) : t.slaDueAt ? (
                    new Date(t.slaDueAt).toLocaleString("pt-BR")
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {queues.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Filas: {queues.map((q) => q.name).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
