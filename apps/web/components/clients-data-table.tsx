"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react";

import { setClientActiveAction } from "@/app/actions/clients";
import { formatPhoneDisplay } from "@/lib/format-phone";
import { ClientsEditDialog } from "@/components/clients-edit-dialog";
import type { ClientFormValues } from "@/components/clients-form";
import { useSyncContext } from "@/components/sync-provider";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
};

function contactLabel(row: ClientRow): string {
  const phone = row.phone ? formatPhoneDisplay(row.phone) : null;
  return [phone, row.email].filter(Boolean).join(" · ") || "—";
}

export function ClientsDataTable({ items }: { items: ClientRow[] }) {
  const { requestSync } = useSyncContext();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [editClient, setEditClient] = React.useState<ClientRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<ClientRow | null>(null);
  const [toggling, setToggling] = React.useState(false);

  const filteredItems = React.useMemo(() => {
    return items.filter((row) => {
      if (!showInactive && !row.active) return false;
      return true;
    });
  }, [items, showInactive]);

  const columns = React.useMemo<ColumnDef<ClientRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <span
            className={
              row.original.active ? "font-medium" : "font-medium text-muted-foreground"
            }
          >
            {row.original.name}
          </span>
        ),
      },
      {
        id: "contact",
        header: "Contato",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {contactLabel(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="secondary">Ativo</Badge>
          ) : (
            <Badge variant="outline">Inativo</Badge>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => {
          const client = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="ml-auto">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditClient(client)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={client.active ? "destructive" : "default"}
                  onClick={() => setToggleTarget(client)}
                >
                  {client.active ? (
                    <>
                      <UserX className="size-4" />
                      Inativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-4" />
                      Reativar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const c = row.original;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  async function confirmToggle() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await setClientActiveAction(toggleTarget.id, !toggleTarget.active);
      await requestSync();
      setToggleTarget(null);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nome, e-mail ou telefone…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm font-normal">
            Mostrar inativos
          </Label>
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhum cliente encontrado para esta busca."
            : "Nenhum cliente cadastrado. Use Adicionar cliente no topo."
        }
      />

      {editClient ? (
        <ClientsEditDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditClient(null);
          }}
          clientId={editClient.id}
          initialValues={{
            name: editClient.name,
            email: editClient.email ?? "",
            phone: editClient.phone ?? "",
          } satisfies ClientFormValues}
        />
      ) : null}

      <Dialog
        open={toggleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.active ? "Inativar cliente" : "Reativar cliente"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.active
                ? `${toggleTarget.name} deixa de aparecer nas vendas, mas o histórico é mantido.`
                : `${toggleTarget?.name} voltará a aparecer como ativo.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={toggling}
              onClick={() => setToggleTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={toggleTarget?.active ? "destructive" : "default"}
              className="w-full sm:w-auto"
              disabled={toggling}
              onClick={() => void confirmToggle()}
            >
              {toggling
                ? "Salvando…"
                : toggleTarget?.active
                  ? "Inativar"
                  : "Reativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
