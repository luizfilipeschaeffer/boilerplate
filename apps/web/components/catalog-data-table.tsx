"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { MoreHorizontal, PackageX, PackageCheck, Pencil } from "lucide-react";

import { setCatalogItemActiveAction } from "@/app/actions/catalog";
import { CatalogEditDialog } from "@/components/catalog-edit-dialog";
import type { CatalogFormValues } from "@/components/catalog-form";
import { useSyncContext } from "@/components/sync-provider";
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

export type CatalogRow = {
  id: string;
  name: string;
  itemType: string;
  sku: string | null;
  priceCents: number | null;
  stockQty: number;
  active: boolean;
};

function itemTypeLabel(type: string): string {
  return type === "servico" ? "Serviço" : "Produto";
}

function priceToFormValue(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function CatalogDataTable({ items }: { items: CatalogRow[] }) {
  const { requestSync } = useSyncContext();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [editItem, setEditItem] = React.useState<CatalogRow | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<CatalogRow | null>(null);
  const [toggling, setToggling] = React.useState(false);

  const filteredItems = React.useMemo(() => {
    return items.filter((row) => {
      if (!showInactive && !row.active) return false;
      return true;
    });
  }, [items, showInactive]);

  const columns = React.useMemo<ColumnDef<CatalogRow>[]>(
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
        accessorKey: "itemType",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {itemTypeLabel(row.original.itemType)}
          </span>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.sku ?? "—"}
          </span>
        ),
      },
      {
        id: "price",
        header: () => <span className="block text-right">Preço</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatBrl(row.original.priceCents)}
          </span>
        ),
      },
      {
        id: "stock",
        header: () => <span className="block text-right">Estoque</span>,
        cell: ({ row }) => (
          <span className="block text-right text-muted-foreground tabular-nums">
            {row.original.itemType === "produto"
              ? row.original.stockQty
              : "—"}
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
          const item = row.original;
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
                <DropdownMenuItem onClick={() => setEditItem(item)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={item.active ? "destructive" : "default"}
                  onClick={() => setToggleTarget(item)}
                >
                  {item.active ? (
                    <>
                      <PackageX className="size-4" />
                      Inativar
                    </>
                  ) : (
                    <>
                      <PackageCheck className="size-4" />
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
        (c.sku?.toLowerCase().includes(q) ?? false) ||
        itemTypeLabel(c.itemType).toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  async function confirmToggle() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await setCatalogItemActiveAction(toggleTarget.id, !toggleTarget.active);
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
          placeholder="Buscar por nome, SKU ou tipo…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive-catalog"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive-catalog" className="text-sm font-normal">
            Mostrar inativos
          </Label>
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={
          globalFilter
            ? "Nenhum item encontrado para esta busca."
            : "Nenhum item no catálogo. Use Adicionar item no topo."
        }
      />

      {editItem ? (
        <CatalogEditDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
          itemId={editItem.id}
          initialValues={{
            name: editItem.name,
            itemType: editItem.itemType as "produto" | "servico",
            sku: editItem.sku ?? "",
            price: priceToFormValue(editItem.priceCents),
          } satisfies CatalogFormValues}
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
              {toggleTarget?.active ? "Inativar item" : "Reativar item"}
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
