"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  issueInstallationTokenAction,
  setInstallationStatusAction,
} from "@/app/actions/installations";
import { PlatformInstallationTokenDialog } from "@/components/platform-installation-token-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModulosDataTableSearch } from "@/modules/platform-modulos/modulos-data-table-search";

export type InstallationTableRow = {
  id: string;
  name: string;
  status: string;
  version: string;
  lastHeartbeatAt: string | null;
  publicUrl: string | null;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};

type OrgOption = { id: string; name: string };

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  pending: "Pendente",
  suspended: "Suspensa",
  revoked: "Revogada",
};

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "revoked") return "destructive";
  if (status === "suspended") return "secondary";
  return "outline";
}

function InstallationsTablePagination<T>({
  table,
}: {
  table: ReturnType<typeof useReactTable<T>>;
}) {
  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-2 border-t px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        {total} instalação(ões)
        {total > 0 ? (
          <>
            {" "}
            · página {pageIndex + 1} de {Math.max(pageCount, 1)}
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

export function PlatformInstallationsView({
  installations,
  organizations,
}: {
  installations: InstallationTableRow[];
  organizations: OrgOption[];
}) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [tokenDialog, setTokenDialog] = useState<{
    open: boolean;
    token: string | null;
    title: string;
    error: string | null;
  }>({ open: false, token: null, title: "", error: null });
  const [pending, startTransition] = useTransition();

  function showTokenResult(title: string, token: string) {
    setTokenDialog({ open: true, token, title, error: null });
  }

  function showTokenError(title: string, error: string) {
    setTokenDialog({ open: true, token: null, title, error });
  }

  const columns = useMemo<ColumnDef<InstallationTableRow>[]>(
    () => [
      {
        id: "nome",
        header: "Nome",
        accessorFn: (row) => `${row.name} ${row.organizationName}`,
        cell: ({ row }) => (
          <Link
            href={`/instalacoes/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "cliente",
        header: "Cliente",
        accessorKey: "organizationName",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.organizationName}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "versao",
        header: "Versão",
        accessorKey: "version",
      },
      {
        id: "heartbeat",
        header: "Último heartbeat",
        accessorFn: (row) => row.lastHeartbeatAt ?? "",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.lastHeartbeatAt
              ? new Date(row.original.lastHeartbeatAt).toLocaleString("pt-BR")
              : "—"}
          </span>
        ),
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => {
          const inst = row.original;
          const isActive = inst.status === "active";
          const isSuspended = inst.status === "suspended";
          const isRevoked = inst.status === "revoked";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Ações</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  render={<Link href={`/instalacoes/${inst.id}`} />}
                >
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<Link href={`/instalacoes/${inst.id}`} />}
                >
                  Configurar domínios
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={pending || isRevoked}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await issueInstallationTokenAction({
                        installationId: inst.id,
                        organizationId: inst.organizationId,
                      });
                      if (!result.ok) {
                        showTokenError(inst.name, result.error);
                        return;
                      }
                      showTokenResult(inst.name, result.installationToken);
                    })
                  }
                >
                  Gerar token de acesso
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isActive ? (
                  <DropdownMenuItem
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setInstallationStatusAction({
                          installationId: inst.id,
                          status: "suspended",
                        });
                        router.refresh();
                      })
                    }
                  >
                    Suspender instalação
                  </DropdownMenuItem>
                ) : null}
                {isSuspended || inst.status === "pending" ? (
                  <DropdownMenuItem
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setInstallationStatusAction({
                          installationId: inst.id,
                          status: "active",
                        });
                        router.refresh();
                      })
                    }
                  >
                    Reativar instalação
                  </DropdownMenuItem>
                ) : null}
                {!isRevoked ? (
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setInstallationStatusAction({
                          installationId: inst.id,
                          status: "revoked",
                        });
                        router.refresh();
                      })
                    }
                  >
                    Revogar instalação
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [pending, router],
  );

  const table = useReactTable({
    data: installations,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <PlatformInstallationTokenDialog organizations={organizations} />

      <Card>
        <CardHeader>
          <CardTitle>Instalações self-hosted</CardTitle>
          <CardDescription>
            VPS registradas, heartbeat e status de saúde (telemetria sanitizada).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModulosDataTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Buscar por nome, cliente, status ou versão…"
          />
          <DataTable
            table={table}
            emptyMessage="Nenhuma instalação encontrada."
          />
          <InstallationsTablePagination table={table} />
        </CardContent>
      </Card>

      <Dialog
        open={tokenDialog.open}
        onOpenChange={(open) =>
          setTokenDialog((prev) => ({
            ...prev,
            open,
            ...(open ? {} : { token: null, error: null }),
          }))
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Token de acesso</DialogTitle>
            <DialogDescription>
              {tokenDialog.title
                ? `Instalação: ${tokenDialog.title}. Válido por 24 h — uso único.`
                : "Copie o token antes de fechar."}
            </DialogDescription>
          </DialogHeader>
          {tokenDialog.token ? (
            <code className="block break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
              {tokenDialog.token}
            </code>
          ) : null}
          {tokenDialog.error ? (
            <p className="text-destructive text-sm">{tokenDialog.error}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setTokenDialog({
                  open: false,
                  token: null,
                  title: "",
                  error: null,
                })
              }
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
