"use client";

import * as React from "react";
import Link from "next/link";
import {
  createSectorAction,
  listSectorsConfigAction,
  setSectorModulesAction,
} from "@/app/actions/sectors-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function ConfigSetoresView() {
  const [data, setData] = React.useState<
    Awaited<ReturnType<typeof listSectorsConfigAction>> | null
  >(null);
  const [name, setName] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState<string | null>(
    null,
  );
  const [moduleIds, setModuleIds] = React.useState<string[]>([]);
  const [savingModules, setSavingModules] = React.useState(false);

  const moduleOptions = data?.orgModuleOptions ?? [];
  const allModuleIds = moduleOptions.map((m) => m.id);

  const reload = React.useCallback(async () => {
    setData(await listSectorsConfigAction());
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  React.useEffect(() => {
    const sector = data?.sectors.find((s) => s.id === selectedSector);
    if (!sector || !data) return;
    setModuleIds(
      sector.moduleIds.length
        ? sector.moduleIds
        : (data.orgModuleOptions ?? []).map((m) => m.id),
    );
  }, [selectedSector, data]);

  if (!data) return <Spinner className="m-8" />;

  const selectedSectorRow = data.sectors.find((s) => s.id === selectedSector);

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo setor</CardTitle>
          <CardDescription>
            Defina quais módulos cada departamento oferece. Vincule membros em{" "}
            <Link
              href="/configuracoes/membros"
              className="text-primary underline-offset-4 hover:underline"
            >
              Configurações → Membros
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Comercial"
          />
          <Button
            onClick={async () => {
              if (!name.trim()) return;
              await createSectorAction({ name: name.trim() });
              setName("");
              await reload();
            }}
          >
            Criar
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Setores</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.sectors.map((s) => (
              <Button
                key={s.id}
                variant={selectedSector === s.id ? "default" : "outline"}
                className="h-auto justify-start py-2"
                onClick={() => setSelectedSector(s.id)}
              >
                <span className="flex flex-1 flex-col items-start gap-0.5">
                  <span className="flex items-center gap-2">
                    {s.name}
                    {s.visibility_status === "em_breve" ? (
                      <Badge variant="outline" className="text-[10px]">
                        Em breve
                      </Badge>
                    ) : null}
                    {s.is_aggregator ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Agregador
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-xs font-normal opacity-70">
                    {s.slug}
                    {s.core_sector_slug
                      ? ` · core:${s.core_sector_slug}`
                      : ""}
                  </span>
                </span>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {s.moduleIds.length || moduleOptions.length} mód.
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>

        {selectedSector && selectedSectorRow ? (
          <Card>
            <CardHeader>
              <CardTitle>Módulos do setor</CardTitle>
              <CardDescription>
                {selectedSectorRow.name} — itens disponíveis no menu quando o
                usuário está neste setor
              </CardDescription>
            </CardHeader>
            <CardContent className="flex max-h-[480px] flex-col gap-3 overflow-hidden">
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b pb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModuleIds([...allModuleIds])}
                >
                  Selecionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModuleIds([])}
                >
                  Desmarcar todos
                </Button>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {moduleIds.length} de {moduleOptions.length} ativos
                </span>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {moduleOptions.map((mod) => {
                  const checked = moduleIds.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 ${
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          setModuleIds((prev) =>
                            value
                              ? [...prev, mod.id]
                              : prev.filter((id) => id !== mod.id),
                          );
                        }}
                      />
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="font-medium">{mod.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {mod.id}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <Button
                className="shrink-0"
                disabled={savingModules}
                onClick={async () => {
                  setSavingModules(true);
                  try {
                    await setSectorModulesAction(selectedSector, moduleIds);
                    await reload();
                  } finally {
                    setSavingModules(false);
                  }
                }}
              >
                {savingModules ? "Salvando…" : "Salvar módulos"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Selecione um setor para configurar os módulos disponíveis.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
