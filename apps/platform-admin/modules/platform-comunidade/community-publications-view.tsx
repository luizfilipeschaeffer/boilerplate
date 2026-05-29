"use client";

import type { EcosystemPublicationRow } from "@boilerplate/db/ecosystem-labels";
import {
  ECOSYSTEM_KIND_LABELS,
  ECOSYSTEM_MODERATION_LABELS,
} from "@boilerplate/db/ecosystem-labels";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { moderatePublicationAction } from "./actions";

function statusVariant(
  status: EcosystemPublicationRow["moderationStatus"],
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved") return "default";
  if (status === "pending_review") return "secondary";
  if (status === "changes_requested") return "outline";
  return "destructive";
}

export function CommunityPublicationsView({
  publications,
  canModerate,
}: {
  publications: EcosystemPublicationRow[];
  canModerate: boolean;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{
    row: EcosystemPublicationRow;
    action: "changes_requested" | "rejected";
  } | null>(null);
  const [notes, setNotes] = useState("");
  const router = useRouter();

  function approve(id: string) {
    startTransition(async () => {
      await moderatePublicationAction({
        id,
        moderationStatus: "approved",
      });
      router.refresh();
    });
  }

  function submitReview() {
    if (!dialog) return;
    startTransition(async () => {
      await moderatePublicationAction({
        id: dialog.row.id,
        moderationStatus: dialog.action,
        reviewNotes: notes,
      });
      setDialog(null);
      setNotes("");
      router.refresh();
    });
  }

  const columns = useMemo<ColumnDef<EcosystemPublicationRow>[]>(
    () => [
      {
        id: "item",
        header: "Publicação",
        accessorFn: (row) =>
          `${row.name} ${row.externalId} ${row.description ?? ""}`,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.externalId}
            </div>
            {row.original.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {row.original.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "kind",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline">
            {ECOSYSTEM_KIND_LABELS[row.original.kind]}
          </Badge>
        ),
      },
      {
        id: "publisher",
        header: "Publicador",
        cell: ({ row }) => (
          <div className="text-xs">
            <div>{row.original.publisherName ?? "—"}</div>
            {row.original.publisherEmail ? (
              <div className="text-muted-foreground">
                {row.original.publisherEmail}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "package",
        header: "Pacote",
        cell: ({ row }) => (
          <span className="font-mono text-xs break-all">
            {row.original.packageName ?? row.original.packagePath ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Moderação",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge variant={statusVariant(row.original.moderationStatus)}>
              {ECOSYSTEM_MODERATION_LABELS[row.original.moderationStatus]}
            </Badge>
            {row.original.availableToTenants ? (
              <span className="text-xs text-muted-foreground">
                Disponível para tenants
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "review",
        header: "Última revisão",
        cell: ({ row }) =>
          row.original.reviewNotes ? (
            <p className="max-w-xs text-xs text-muted-foreground line-clamp-3">
              {row.original.reviewNotes}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      ...(canModerate
        ? [
            {
              id: "actions",
              header: "Ações",
              cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={
                      pending || row.original.moderationStatus === "approved"
                    }
                    onClick={() => approve(row.original.id)}
                  >
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      setNotes(row.original.reviewNotes ?? "");
                      setDialog({
                        row: row.original,
                        action: "changes_requested",
                      });
                    }}
                  >
                    Revisar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => {
                      setNotes(row.original.reviewNotes ?? "");
                      setDialog({ row: row.original, action: "rejected" });
                    }}
                  >
                    Rejeitar
                  </Button>
                </div>
              ),
            } as ColumnDef<EcosystemPublicationRow>,
          ]
        : []),
    ],
    [canModerate, pending],
  );

  const table = useReactTable({
    data: publications,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const pendingCount = publications.filter(
    (p) => p.moderationStatus === "pending_review",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {publications.length} publicações da comunidade ({pendingCount}{" "}
        aguardando revisão). Aprove para liberar uso pelos tenants ou devolva com
        comentários ao desenvolvedor.
      </p>

      <Input
        placeholder="Buscar por nome, id ou descrição…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-md"
      />

      <DataTable
        table={table}
        emptyMessage="Nenhuma publicação da comunidade encontrada."
      />

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === "rejected"
                ? "Rejeitar publicação"
                : "Solicitar ajustes"}
            </DialogTitle>
            <DialogDescription>
              O comentário será visível para o time e registrado na auditoria da
              plataforma.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Descreva o que o desenvolvedor deve corrigir…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog(null);
                setNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pending || !notes.trim()}
              onClick={submitReview}
            >
              {pending ? "Salvando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
