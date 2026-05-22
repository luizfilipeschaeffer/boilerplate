"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import {
  MEMBER_ACCOUNT_STATUS_LABELS,
  MemberAccountStatusBadge,
  type MemberAccountStatus,
} from "@/lib/member-account-status";
import { roleLabel } from "@/lib/role-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

export type MemberTableRow = {
  membershipId: string;
  name: string;
  email: string;
  role: string;
  sectorIds: string[];
  accountStatus: MemberAccountStatus;
};

export function MembersDataTable({
  members,
  onConfigureAccess,
}: {
  members: MemberTableRow[];
  onConfigureAccess: (membershipId: string) => void;
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<MemberTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "E-mail",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        id: "role",
        header: "Papel",
        cell: ({ row }) => (
          <Badge variant="secondary">{roleLabel(row.original.role)}</Badge>
        ),
      },
      {
        id: "accountStatus",
        header: "Conta",
        cell: ({ row }) => (
          <MemberAccountStatusBadge status={row.original.accountStatus} />
        ),
      },
      {
        id: "sectors",
        header: () => <span className="block text-right">Setores</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums text-muted-foreground">
            {row.original.sectorIds.length > 0
              ? row.original.sectorIds.length
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfigureAccess(row.original.membershipId);
              }}
            >
              <Settings2 className="size-4" />
              <span className="hidden sm:inline">Acesso</span>
            </Button>
          </div>
        ),
      },
    ],
    [onConfigureAccess],
  );

  const table = useReactTable({
    data: members,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase();
      if (!q) return true;
      const m = row.original;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        roleLabel(m.role).toLowerCase().includes(q) ||
        MEMBER_ACCOUNT_STATUS_LABELS[m.accountStatus]
          .toLowerCase()
          .includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por nome, e-mail, papel ou status…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-md"
      />
      <DataTable
        table={table}
        onRowClick={(row) => onConfigureAccess(row.membershipId)}
        emptyMessage={
          globalFilter
            ? "Nenhum membro encontrado para esta busca."
            : "Nenhum membro cadastrado. Use Novo membro no topo."
        }
      />
    </div>
  );
}
