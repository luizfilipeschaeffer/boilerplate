"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { LibraryCatalog, LibraryIntegrator, LibraryModule } from "@/lib/catalog-types";

const TRUST_LABELS: Record<string, string> = {
  official: "Oficial",
  verified: "Verificado",
  certified: "Certificado",
  community: "Comunidade",
};

type TabId = "all" | "modules" | "integrators";

type Props = {
  catalog: LibraryCatalog;
};

export function MarketplaceLibrary({ catalog }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = parseTab(searchParams.get("tab"));
  const [tab, setTab] = useState<TabId>(initialTab);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const integratorTipos = useMemo(() => {
    const set = new Set(catalog.integrators.map((i) => i.tipo));
    return [...set].sort();
  }, [catalog.integrators]);

  const filteredModules = useMemo(
    () =>
      catalog.modules.filter((m) => {
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        return matchesQuery(m, query);
      }),
    [catalog.modules, query, statusFilter],
  );

  const filteredIntegrators = useMemo(
    () =>
      catalog.integrators.filter((i) => {
        if (statusFilter !== "all" && i.status !== statusFilter) return false;
        if (tipoFilter !== "all" && i.tipo !== tipoFilter) return false;
        return matchesQuery(i, query);
      }),
    [catalog.integrators, query, statusFilter, tipoFilter],
  );

  function onTabChange(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={(v) => onTabChange(v as TabId)}>
      <div className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="integrators">Integradores</TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Buscar por nome, id ou descrição…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Implementado">Implementado</SelectItem>
              <SelectItem value="Em desenvolvimento">Em desenvolvimento</SelectItem>
              <SelectItem value="Planejado">Planejado</SelectItem>
            </SelectContent>
          </Select>
          {(tab === "integrators" || tab === "all") && (
            <Select
              value={tipoFilter}
              onValueChange={(v) => setTipoFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {integratorTipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <TabsContent value="all" className="mt-4 flex min-w-0 flex-col gap-6">
        <ModulesSection modules={filteredModules} />
        <IntegratorsSection integrators={filteredIntegrators} />
      </TabsContent>

      <TabsContent value="modules" className="mt-4 min-w-0">
        <ModulesSection modules={filteredModules} />
      </TabsContent>

      <TabsContent value="integrators" className="mt-4 min-w-0">
        <IntegratorsSection integrators={filteredIntegrators} />
      </TabsContent>
    </Tabs>
  );
}

function ModulesSection({ modules }: { modules: LibraryModule[] }) {
  const columns = useMemo<ColumnDef<LibraryModule>[]>(
    () => [
      {
        id: "modulo",
        header: "Módulo",
        accessorFn: (row) =>
          `${row.name} ${row.id} ${row.description} ${row.dependencias.join(" ")}`,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="min-w-0">
              <div className="font-medium">{m.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{m.id}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {m.description}
              </p>
              <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>
                  <dt className="sr-only">Pacote</dt>
                  <dd className="break-all font-mono">
                    {m.namespace}/{m.id}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Fase mínima</dt>
                  <dd>Fase mínima: {m.faseMinima}</dd>
                </div>
                {m.dependencias.length > 0 ? (
                  <div>
                    <dt className="sr-only">Dependências</dt>
                    <dd className="break-words">
                      Dependências: {m.dependencias.join(", ")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          );
        },
      },
      {
        id: "indicadores",
        header: "Indicadores",
        cell: ({ row }) => (
          <div className="flex w-[9.5rem] flex-col gap-1.5">
            <Badge variant={trustVariant(row.original.trustLevel)}>
              {TRUST_LABELS[row.original.trustLevel] ?? row.original.trustLevel}
            </Badge>
            <Badge variant={statusVariant(row.original.status)}>
              {row.original.status}
            </Badge>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: modules,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Módulos</h2>
        <span className="text-xs text-muted-foreground">
          {modules.length} resultados
        </span>
      </div>
      <DataTable
        table={table}
        className="min-w-0"
        emptyMessage="Nenhum módulo encontrado com os filtros atuais."
      />
    </section>
  );
}

function IntegratorsSection({ integrators }: { integrators: LibraryIntegrator[] }) {
  const columns = useMemo<ColumnDef<LibraryIntegrator>[]>(
    () => [
      {
        id: "integrador",
        header: "Integrador",
        accessorFn: (row) =>
          `${row.name} ${row.id} ${row.provider} ${row.description} ${row.modulosSuportados.join(" ")}`,
        cell: ({ row }) => {
          const i = row.original;
          const mods = i.modulosSuportados;
          const modulosLabel = mods.includes("*")
            ? "Todos os módulos"
            : mods.join(", ");

          return (
            <div className="min-w-0">
              <div className="font-medium">{i.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{i.id}</div>
              {i.provider ? (
                <div className="text-xs text-muted-foreground">{i.provider}</div>
              ) : null}
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {i.description}
              </p>
              <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>
                  <dt className="sr-only">Módulos suportados</dt>
                  <dd className="break-words">Módulos: {modulosLabel}</dd>
                </div>
                {i.packagePath ? (
                  <div>
                    <dt className="sr-only">Pacote</dt>
                    <dd className="break-all font-mono">{i.packagePath}</dd>
                  </div>
                ) : null}
                {i.deliveryMarco ? (
                  <div>
                    <dt className="sr-only">Marco</dt>
                    <dd>Marco: {i.deliveryMarco}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          );
        },
      },
      {
        id: "indicadores",
        header: "Indicadores",
        cell: ({ row }) => (
          <div className="flex w-[9.5rem] flex-col gap-1.5">
            <Badge variant="outline">{row.original.tipo}</Badge>
            <Badge variant={trustVariant(row.original.trustLevel)}>
              {TRUST_LABELS[row.original.trustLevel] ?? row.original.trustLevel}
            </Badge>
            <Badge variant={statusVariant(row.original.status)}>
              {row.original.status}
            </Badge>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: integrators,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Integradores</h2>
        <span className="text-xs text-muted-foreground">
          {integrators.length} resultados
        </span>
      </div>
      <DataTable
        table={table}
        className="min-w-0"
        emptyMessage="Nenhum integrador encontrado com os filtros atuais."
      />
    </section>
  );
}

function trustVariant(
  trust: string,
): "default" | "secondary" | "outline" {
  if (trust === "official") return "default";
  if (trust === "verified" || trust === "certified") return "secondary";
  return "outline";
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "Implementado") return "default";
  if (status === "Em desenvolvimento") return "secondary";
  return "outline";
}

function matchesQuery(
  item: LibraryModule | LibraryIntegrator,
  query: string,
): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    item.id.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.status.toLowerCase().includes(q)
  );
}

function parseTab(value: string | null): TabId {
  if (value === "modules" || value === "integrators") return value;
  return "all";
}