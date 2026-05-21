"use client";

import type {
  BundlePrecoRow,
  ModuloPrecoRow,
  PlanoBaseRow,
} from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import { formatCentavosBRL } from "@boilerplate/billing";
import { useState } from "react";
import {
  saveBundlePrecoAction,
  saveModuloPrecoAction,
  savePlanoBaseAction,
} from "./actions";

type Tab = "modulos" | "planos" | "bundles" | "ativacoes";

function centsToReaisInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

function reaisInputToCents(value: string): number {
  const n = Number(value.replace(",", ".").replace(/[^\d.]/g, ""));
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

const STATUS_LABELS: Record<ModuleDefinition["implementationStatus"], string> = {
  implemented: "Implementado",
  scaffold: "Scaffold",
  deprecated: "Descontinuado",
};

export function ModulosManagerClient({
  modules,
  precos,
  planos,
  bundles,
  ativacoes,
  canEdit,
}: {
  modules: ModuleDefinition[];
  precos: ModuloPrecoRow[];
  planos: PlanoBaseRow[];
  bundles: BundlePrecoRow[];
  ativacoes: { moduloId: string; count: number }[];
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<Tab>("modulos");
  const precoMap = new Map(precos.map((p) => [p.moduleId, p]));

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex flex-wrap gap-1 rounded-lg border p-0.5">
        {(
          [
            ["modulos", "Catálogo"],
            ["planos", "Planos base"],
            ["bundles", "Bundles"],
            ["ativacoes", "Ativações"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "modulos" ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2">Módulo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Fase mín.</th>
                <th className="px-3 py-2">Preço/mês</th>
                <th className="px-3 py-2">Add-on</th>
                <th className="px-3 py-2">Ativo</th>
                {canEdit ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => {
                const preco = precoMap.get(mod.id);
                return (
                  <ModuloPrecoRowEditor
                    key={mod.id}
                    mod={mod}
                    preco={preco}
                    canEdit={canEdit}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "planos" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {planos.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} canEdit={canEdit} />
          ))}
        </div>
      ) : null}

      {tab === "bundles" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} canEdit={canEdit} />
          ))}
        </div>
      ) : null}

      {tab === "ativacoes" ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2">Módulo</th>
                <th className="px-3 py-2 text-right">Organizações</th>
              </tr>
            </thead>
            <tbody>
              {ativacoes.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhuma ativação registrada.
                  </td>
                </tr>
              ) : (
                ativacoes.map((a) => (
                  <tr key={a.moduloId} className="border-b">
                    <td className="px-3 py-2 font-medium">{a.moduloId}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{a.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function ModuloPrecoRowEditor({
  mod,
  preco,
  canEdit,
}: {
  mod: ModuleDefinition;
  preco?: ModuloPrecoRow;
  canEdit: boolean;
}) {
  const [price, setPrice] = useState(
    centsToReaisInput(preco?.precoMensalCentavos ?? 0),
  );
  const [faseMin, setFaseMin] = useState(String(preco?.faseMinima ?? mod.faseMinima));
  const [addon, setAddon] = useState(preco?.cobrancaAvulsa ?? true);
  const [ativo, setAtivo] = useState(preco?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <tr className="border-b">
      <td className="px-3 py-2">
        <div className="font-medium">{mod.name}</div>
        <div className="text-xs text-muted-foreground">{mod.id}</div>
      </td>
      <td className="px-3 py-2 text-xs">
        {STATUS_LABELS[mod.implementationStatus]}
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <input
            type="number"
            min={1}
            max={4}
            className="w-14 rounded border px-1 py-0.5"
            value={faseMin}
            onChange={(e) => setFaseMin(e.target.value)}
          />
        ) : (
          preco?.faseMinima ?? mod.faseMinima
        )}
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <input
            className="w-24 rounded border px-2 py-0.5"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        ) : (
          formatCentavosBRL(preco?.precoMensalCentavos ?? 0)
        )}
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <input
            type="checkbox"
            checked={addon}
            onChange={(e) => setAddon(e.target.checked)}
          />
        ) : addon ? (
          "Sim"
        ) : (
          "Incluído"
        )}
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
        ) : ativo ? (
          "Sim"
        ) : (
          "Não"
        )}
      </td>
      {canEdit ? (
        <td className="px-3 py-2">
          <button
            type="button"
            disabled={saving}
            className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
            onClick={async () => {
              setSaving(true);
              try {
                await saveModuloPrecoAction({
                  moduleId: mod.id,
                  precoMensalCentavos: reaisInputToCents(price),
                  faseMinima: Number(faseMin) || mod.faseMinima,
                  cobrancaAvulsa: addon,
                  ativo,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </button>
        </td>
      ) : null}
    </tr>
  );
}

function PlanoCard({
  plano,
  canEdit,
}: {
  plano: PlanoBaseRow;
  canEdit: boolean;
}) {
  const [nome, setNome] = useState(plano.nome);
  const [preco, setPreco] = useState(centsToReaisInput(plano.precoMensalCentavos));
  const [faseMin, setFaseMin] = useState(String(plano.faseMinima));
  const [faseMax, setFaseMax] = useState(String(plano.faseMaxima));
  const [modulos, setModulos] = useState(plano.modulosInclusos.join(", "));
  const [ativo, setAtivo] = useState(plano.ativo);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{plano.id}</h3>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        <label className="flex flex-col gap-1">
          Nome
          <input
            className="rounded border px-2 py-1"
            value={nome}
            disabled={!canEdit}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Preço/mês (R$)
          <input
            className="rounded border px-2 py-1"
            value={preco}
            disabled={!canEdit}
            onChange={(e) => setPreco(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1">
            Fase mín.
            <input
              type="number"
              min={1}
              max={4}
              className="rounded border px-2 py-1"
              value={faseMin}
              disabled={!canEdit}
              onChange={(e) => setFaseMin(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            Fase máx.
            <input
              type="number"
              min={1}
              max={4}
              className="rounded border px-2 py-1"
              value={faseMax}
              disabled={!canEdit}
              onChange={(e) => setFaseMax(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          Módulos inclusos (ids separados por vírgula)
          <textarea
            className="min-h-[72px] rounded border px-2 py-1 font-mono text-xs"
            value={modulos}
            disabled={!canEdit}
            onChange={(e) => setModulos(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            disabled={!canEdit}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          Plano ativo
        </label>
        {canEdit ? (
          <button
            type="button"
            disabled={saving}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={async () => {
              setSaving(true);
              try {
                await savePlanoBaseAction({
                  id: plano.id,
                  nome: nome.trim(),
                  precoMensalCentavos: reaisInputToCents(preco),
                  faseMinima: Number(faseMin) || 1,
                  faseMaxima: Number(faseMax) || 4,
                  modulosInclusos: modulos
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  ativo,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar plano
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BundleCard({
  bundle,
  canEdit,
}: {
  bundle: BundlePrecoRow;
  canEdit: boolean;
}) {
  const [nome, setNome] = useState(bundle.nome);
  const [preco, setPreco] = useState(centsToReaisInput(bundle.precoMensalCentavos));
  const [modulos, setModulos] = useState(bundle.moduleIds.join(", "));
  const [ativo, setAtivo] = useState(bundle.ativo);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{bundle.id}</h3>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        <label className="flex flex-col gap-1">
          Nome
          <input
            className="rounded border px-2 py-1"
            value={nome}
            disabled={!canEdit}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Preço bundle (R$)
          <input
            className="rounded border px-2 py-1"
            value={preco}
            disabled={!canEdit}
            onChange={(e) => setPreco(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Módulos do bundle
          <textarea
            className="min-h-[56px] rounded border px-2 py-1 font-mono text-xs"
            value={modulos}
            disabled={!canEdit}
            onChange={(e) => setModulos(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            disabled={!canEdit}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          Bundle ativo
        </label>
        {canEdit ? (
          <button
            type="button"
            disabled={saving}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={async () => {
              setSaving(true);
              try {
                await saveBundlePrecoAction({
                  id: bundle.id,
                  nome: nome.trim(),
                  precoMensalCentavos: reaisInputToCents(preco),
                  moduleIds: modulos
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  ativo,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar bundle
          </button>
        ) : null}
      </div>
    </div>
  );
}
