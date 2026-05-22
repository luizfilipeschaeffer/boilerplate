"use client";

import type { PlanoBaseRow } from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPlanoBaseAction,
  deletePlanoBaseAction,
  savePlanoBaseAction,
  setPlanoBaseAtivoAction,
} from "./actions";
import {
  centsToReaisInput,
  normalizePricingId,
  reaisInputToCents,
} from "./modulos-pricing-utils";

export type PlanoDialogMode = "create" | "edit";

export function PlanoEditDialog({
  plano,
  mode,
  open,
  onOpenChange,
  modules,
  canEdit,
}: {
  plano: PlanoBaseRow | null;
  mode: PlanoDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: ModuleDefinition[];
  canEdit: boolean;
}) {
  const isCreate = mode === "create";
  const [planoId, setPlanoId] = useState("");
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("0,00");
  const [faseMin, setFaseMin] = useState("1");
  const [faseMax, setFaseMax] = useState("2");
  const [modulosSelecionados, setModulosSelecionados] = useState<Set<string>>(
    new Set(),
  );
  const [ativo, setAtivo] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFiltroModulo("");
    if (isCreate) {
      setPlanoId("");
      setNome("");
      setPreco("0,00");
      setFaseMin("1");
      setFaseMax("2");
      setModulosSelecionados(new Set());
      setAtivo(true);
      return;
    }
    if (!plano) return;
    setPlanoId(plano.id);
    setNome(plano.nome);
    setPreco(centsToReaisInput(plano.precoMensalCentavos));
    setFaseMin(String(plano.faseMinima));
    setFaseMax(String(plano.faseMaxima));
    setModulosSelecionados(new Set(plano.modulosInclusos));
    setAtivo(plano.ativo);
  }, [open, plano, isCreate]);

  useEffect(() => {
    if (!isCreate || !open) return;
    if (planoId.trim()) return;
    const slug = normalizePricingId(nome);
    if (slug) setPlanoId(slug);
  }, [nome, isCreate, open, planoId]);

  const modulosFiltrados = useMemo(() => {
    const q = filtroModulo.trim().toLowerCase();
    const sorted = [...modules].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [modules, filtroModulo]);

  function toggleModulo(moduleId: string) {
    if (!canEdit) return;
    setModulosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function buildPayload(): PlanoBaseRow {
    return {
      id: normalizePricingId(isCreate ? planoId : plano!.id),
      nome: nome.trim(),
      precoMensalCentavos: reaisInputToCents(preco),
      faseMinima: Number(faseMin) || 1,
      faseMaxima: Number(faseMax) || 4,
      modulosInclusos: [...modulosSelecionados].sort(),
      ativo,
    };
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      if (isCreate) {
        await createPlanoBaseAction(buildPayload());
      } else {
        await savePlanoBaseAction(buildPayload());
      }
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo() {
    if (!canEdit || isCreate || !plano) return;
    setSaving(true);
    setError(null);
    try {
      await setPlanoBaseAtivoAction(plano.id, !ativo);
      setAtivo(!ativo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canEdit || isCreate || !plano) return;
    const ok = window.confirm(
      `Excluir o plano "${plano.nome}" (${plano.id})? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await deletePlanoBaseAction(plano.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir plano.");
    } finally {
      setSaving(false);
    }
  }

  const title = isCreate
    ? "Novo plano base"
    : canEdit
      ? "Editar plano"
      : "Detalhes do plano";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {title}
            {!isCreate && plano ? (
              <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                {plano.id}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Defina preço, faixa de fases e módulos inclusos no plano base.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {isCreate ? (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="plano-id">Identificador (slug)</Label>
                <Input
                  id="plano-id"
                  value={planoId}
                  disabled={!canEdit}
                  placeholder="ex.: meu-plano"
                  className="font-mono text-sm"
                  onChange={(e) => setPlanoId(normalizePricingId(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Usado internamente; gerado automaticamente a partir do nome se vazio.
                </p>
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="plano-nome">Nome exibido</Label>
              <Input
                id="plano-nome"
                value={nome}
                disabled={!canEdit}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plano-preco">Preço mensal (R$)</Label>
              <Input
                id="plano-preco"
                value={preco}
                disabled={!canEdit}
                onChange={(e) => setPreco(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="flex items-end gap-2">
              {!isCreate ? <PlanoStatusBadge ativo={ativo} /> : null}
              {canEdit && !isCreate ? (
                <label className="flex cursor-pointer items-center gap-2 pb-0.5 text-sm">
                  <input
                    type="checkbox"
                    checked={ativo}
                    disabled={saving}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  Plano ativo
                </label>
              ) : isCreate ? (
                <label className="flex cursor-pointer items-center gap-2 pb-0.5 text-sm">
                  <input
                    type="checkbox"
                    checked={ativo}
                    disabled={!canEdit}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  Criar como ativo
                </label>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plano-fase-min">Fase mínima</Label>
              <Input
                id="plano-fase-min"
                type="number"
                min={1}
                max={4}
                value={faseMin}
                disabled={!canEdit}
                onChange={(e) => setFaseMin(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plano-fase-max">Fase máxima</Label>
              <Input
                id="plano-fase-max"
                type="number"
                min={1}
                max={4}
                value={faseMax}
                disabled={!canEdit}
                onChange={(e) => setFaseMax(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Módulos inclusos</Label>
              <span className="text-xs text-muted-foreground">
                {modulosSelecionados.size}{" "}
                {modulosSelecionados.size === 1
                  ? "módulo selecionado"
                  : "módulos selecionados"}
              </span>
            </div>
            <Input
              placeholder="Filtrar por nome ou id…"
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
            />
            <div className="max-h-56 overflow-y-auto rounded-lg border">
              {modulosFiltrados.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Nenhum módulo encontrado.
                </p>
              ) : (
                <ul className="divide-y">
                  {modulosFiltrados.map((mod) => {
                    const checked = modulosSelecionados.has(mod.id);
                    return (
                      <li key={mod.id}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 px-3 py-2 text-sm hover:bg-muted/50 ${
                            !canEdit ? "cursor-default" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            disabled={!canEdit}
                            onChange={() => toggleModulo(mod.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-medium">{mod.name}</span>
                            <span className="block font-mono text-xs text-muted-foreground">
                              {mod.id}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setModulosSelecionados(new Set(modules.map((m) => m.id)))
                  }
                >
                  Selecionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModulosSelecionados(new Set())}
                >
                  Limpar
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:items-center">
          {canEdit && !isCreate && plano ? (
            <div className="flex w-full flex-wrap gap-2 sm:mr-auto">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={saving}
                onClick={handleDelete}
              >
                Excluir
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleToggleAtivo}
              >
                {ativo ? "Inativar" : "Reativar"}
              </Button>
            </div>
          ) : (
            <div className="hidden sm:block sm:flex-1" />
          )}
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {canEdit ? "Cancelar" : "Fechar"}
            </Button>
            {canEdit ? (
              <Button type="button" disabled={saving} onClick={handleSave}>
                {saving ? "Salvando…" : isCreate ? "Criar plano" : "Salvar"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlanoStatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "default" : "secondary"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}
