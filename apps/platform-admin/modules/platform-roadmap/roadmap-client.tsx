"use client";

import type {
  PlatformDepthSummary,
  PublicChangelogEntry,
  RoadmapSectorGroup,
} from "@boilerplate/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { DepthBar } from "./depth-bar";

type Tab = "setores" | "changelog" | "resumo";

const STATUS_LABELS: Record<string, string> = {
  implemented: "Implementado",
  scaffold: "Scaffold",
  deprecated: "Descontinuado",
};

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "implemented") return "default";
  if (status === "scaffold") return "secondary";
  return "outline";
}

export function RoadmapClient({
  sectors,
  changelog,
  summary,
}: {
  sectors: RoadmapSectorGroup[];
  changelog: PublicChangelogEntry[];
  summary: PlatformDepthSummary;
}) {
  const [tab, setTab] = useState<Tab>("setores");

  const tabs: { id: Tab; label: string }[] = [
    { id: "setores", label: "Por setor" },
    { id: "changelog", label: "Changelog" },
    { id: "resumo", label: "Resumo" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                : "rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "setores" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {sectors.map((sector) => (
            <Card key={sector.slug}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{sector.name}</CardTitle>
                    <CardDescription>
                      {sector.camada} · {sector.presenca} · média{" "}
                      {sector.sectorProgressPct}%
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{sector.modules.length} módulos</Badge>
                </div>
                <DepthBar
                  current={sector.sectorProgressPct}
                  target={100}
                  label="Profundidade do setor"
                />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {sector.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{mod.name}</span>
                      <Badge variant={statusVariant(mod.implementationStatus)}>
                        {STATUS_LABELS[mod.implementationStatus] ??
                          mod.implementationStatus}
                      </Badge>
                    </div>
                    <DepthBar
                      current={mod.depthCurrent}
                      target={mod.depthTarget}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Fase mín. P{mod.faseMinima}
                      {mod.deliveryMarco
                        ? ` · entregue ${mod.deliveryMarco}`
                        : ""}
                      {mod.depthTargetMarco
                        ? ` · alvo ${mod.depthTargetMarco}`
                        : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "changelog" ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolução publicada</CardTitle>
            <CardDescription>
              Releases visíveis aos tenants (`show_to_tenants`).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {changelog.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma entrada no changelog.
              </p>
            ) : (
              changelog.map((entry) => (
                <div
                  key={entry.id}
                  className="border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{entry.title}</span>
                    <Badge variant="outline">{entry.moduleName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      D{entry.depthFrom} → D{entry.depthTo}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.publicSummary}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(entry.releasedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "resumo" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profundidade da plataforma</CardTitle>
              <CardDescription>
                Média de D atual / D alvo nos módulos sincronizados com o
                registry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {summary.platformDepthPct}%
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.moduleCount} módulos no catálogo
              </p>
              <div className="mt-4">
                <DepthBar
                  current={summary.platformDepthPct}
                  target={100}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Por marco de entrega</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {Object.entries(summary.byMarco).map(([marco, count]) => (
                <div key={marco} className="flex justify-between">
                  <span>{marco}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Por status de implementação</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {Object.entries(summary.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
