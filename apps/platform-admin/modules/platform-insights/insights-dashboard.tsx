"use client";

import type {
  FunnelStageCount,
  MatrixCoverageCell,
  ModuloDemandaRow,
  TenantHealthRow,
  TipoInteresseRow,
} from "@boilerplate/db";
import { formatTipoNegocio, FASE_LABELS, FASES } from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { exportInsightsCsvAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function InsightsDashboard({
  demanda,
  funnel,
  tipoInteresse,
  matrixOverallPct,
  matrixSample,
  health,
}: {
  demanda: ModuloDemandaRow[];
  funnel: FunnelStageCount[];
  tipoInteresse: TipoInteresseRow[];
  matrixOverallPct: number;
  matrixSample: MatrixCoverageCell[];
  health: TenantHealthRow[];
}) {
  const [exporting, setExporting] = useState(false);

  const healthBadge = (label: TenantHealthRow["healthLabel"]) => {
    if (label === "saudável") return <Badge variant="default">Saudável</Badge>;
    if (label === "atenção") return <Badge variant="secondary">Atenção</Badge>;
    return <Badge variant="destructive">Risco</Badge>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const csv = await exportInsightsCsvAction();
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `insights-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? "Exportando…" : "Exportar CSV (sprint)"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funil comercial</CardTitle>
            <CardDescription>Lead → trial → ativo → expansão</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobertura da matriz</CardTitle>
            <CardDescription>
              Módulos implementados no registry — média global {matrixOverallPct}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {matrixSample.map((c) => (
                <li key={`${c.fase}-${c.tipo}`} className="flex justify-between">
                  <span>
                    Fase {c.fase} · {formatTipoNegocio(c.tipo)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {c.coveragePct}% ({c.implemented}/{c.totalModules})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top módulos demandados</CardTitle>
          <CardDescription>Fonte: modulo_demanda no onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          {demanda.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registros.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="text-right">Orgs</TableHead>
                  <TableHead>Por tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demanda.slice(0, 12).map((d) => (
                  <TableRow key={d.moduloId}>
                    <TableCell className="font-medium">{d.moduloId}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.count}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.byTipo
                        .slice(0, 3)
                        .map((t) => `${formatTipoNegocio(t.tipoNegocio)} (${t.count})`)
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {tipoInteresse.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tipos de negócio (interesse planejado)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {tipoInteresse.map((t) => (
                <li key={t.tipoId} className="flex justify-between">
                  <span>{t.tipoId}</span>
                  <span className="tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Health score por tenant</CardTitle>
          <CardDescription>
            Heurística MVP: estágio CRM, módulos ativos, demanda e último evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {health.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem organizações.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organização</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.slice(0, 20).map((h) => (
                  <TableRow key={h.organizationId}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="text-xs">
                      {formatTipoNegocio(h.tipoNegocio)}
                    </TableCell>
                    <TableCell>
                      {FASE_LABELS[FASES.includes(h.phase as Fase) ? (h.phase as Fase) : 1]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.healthScore}
                    </TableCell>
                    <TableCell>{healthBadge(h.healthLabel)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
