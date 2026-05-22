"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { MoreHorizontal, Pencil, UserCheck, UserX } from "lucide-react";

import { setSellerActiveAction } from "@/app/actions/sellers";
import { SellerEditDialog } from "@/components/seller-edit-dialog";
import {
  commissionBpToFormValue,
  type SellerFormValues,
} from "@/components/seller-form";
import { formatBrl } from "@/lib/format-money";
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

export type SellerTableRow = {
  id: string;
  name: string;
  email: string | null;
  commission_rate_bp: number;
  active: boolean;
  sale_count: number;
  total_cents: number;
};

export function SellersDataTable({
  sellers,
  onChanged,
}: {
  sellers: SellerTableRow[];
  onChanged?: () => void | Promise<void>;
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [editSeller, setEditSeller] = React.useState<SellerTableRow | null>(
    null,
  );
  const [toggleTarget, setToggleTarget] = React.useState<SellerTableRow | null>(
    null,
  );
  const [toggling, setToggling] = React.useState(false);

  const filteredSellers = React.useMemo(() => {
    return sellers.filter((row) => showInactive || row.active);
  }, [sellers, showInactive]);

  const columns = React.useMemo<ColumnDef<SellerTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <span
            className={
              row.original.active
                ? "font-medium"
                : "font-medium text-muted-foreground"
            }
          >
            {row.original.name}
          </span>
        ),
      },
      {
        id: "commission",
        header: "Comissão",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {(row.original.commission_rate_bp / 100).toFixed(1)}%
          </span>
        ),
      },
      {
        id: "sales",
        header: () => <span className="block text-right">Vendas</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {row.original.sale_count}
          </span>
        ),
      },
      {
        id: "total",
        header: () => <span className="block text-right">Total</span>,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatBrl(row.original.total_cents)}
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
          const seller = row.original;
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
                <DropdownMenuItem onClick={() => setEditSeller(seller)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={seller.active ? "destructive" : "default"}
                  onClick={() => setToggleTarget(seller)}
                >
                  {seller.active ? (
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
    data: filteredSellers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const s = row.original;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q) ?? false)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  async function confirmToggle() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await setSellerActiveAction(toggleTarget.id, !toggleTarget.active);
      setToggleTarget(null);
      await onChanged?.();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive-sellers"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive-sellers" className="text-sm font-normal">
            Mostrar inativos
          </Label>
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhum vendedor encontrado para esta busca."
            : "Nenhum vendedor cadastrado. Use Cadastrar vendedor no topo."
        }
      />

      {editSeller ? (
        <SellerEditDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditSeller(null);
          }}
          sellerId={editSeller.id}
          initialValues={
            {
              name: editSeller.name,
              email: editSeller.email ?? "",
              commission: commissionBpToFormValue(editSeller.commission_rate_bp),
            } satisfies SellerFormValues
          }
          onSuccess={onChanged}
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
              {toggleTarget?.active ? "Inativar vendedor" : "Reativar vendedor"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.active
                ? `${toggleTarget?.name} deixa de aparecer nas vendas, mas o histórico é mantido.`
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
