"use client";

import type { BundlePrecoRow } from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import { useEffect, useState } from "react";
import { PlanoStatusBadge } from "./plano-edit-dialog";
import { ModulosBadgePicker } from "./modulos-badge-picker";
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
  createBundlePrecoAction,
  deleteBundlePrecoAction,
  saveBundlePrecoAction,
  setBundlePrecoAtivoAction,
} from "./actions";
import {
  centsToReaisInput,
  normalizePricingId,
  reaisInputToCents,
} from "./modulos-pricing-utils";

export type BundleDialogMode = "create" | "edit";

export function BundleEditDialog({
  bundle,
  mode,
  open,
  onOpenChange,
  modules,
  canEdit,
}: {
  bundle: BundlePrecoRow | null;
  mode: BundleDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: ModuleDefinition[];
  canEdit: boolean;
}) {
  const isCreate = mode === "create";
  const [bundleId, setBundleId] = useState("");
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("0,00");
  const [modulosSelecionados, setModulosSelecionados] = useState<Set<string>>(
    new Set(),
  );
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isCreate) {
      setBundleId("");
      setNome("");
      setPreco("0,00");
      setModulosSelecionados(new Set());
      setAtivo(true);
      return;
    }
    if (!bundle) return;
    setBundleId(bundle.id);
    setNome(bundle.nome);
    setPreco(centsToReaisInput(bundle.precoMensalCentavos));
    setModulosSelecionados(new Set(bundle.moduleIds));
    setAtivo(bundle.ativo);
  }, [open, bundle, isCreate]);

  useEffect(() => {
    if (!isCreate || !open) return;
    if (bundleId.trim()) return;
    const slug = normalizePricingId(nome);
    if (slug) setBundleId(slug);
  }, [nome, isCreate, open, bundleId]);

  function buildPayload(): BundlePrecoRow {
    return {
      id: normalizePricingId(isCreate ? bundleId : bundle!.id),
      nome: nome.trim(),
      precoMensalCentavos: reaisInputToCents(preco),
      moduleIds: [...modulosSelecionados].sort(),
      ativo,
    };
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      if (isCreate) {
        await createBundlePrecoAction(buildPayload());
      } else {
        await saveBundlePrecoAction(buildPayload());
      }
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar bundle.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo() {
    if (!canEdit || isCreate || !bundle) return;
    setSaving(true);
    setError(null);
    try {
      await setBundlePrecoAtivoAction(bundle.id, !ativo);
      setAtivo(!ativo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canEdit || isCreate || !bundle) return;
    const ok = window.confirm(
      `Excluir o bundle "${bundle.nome}" (${bundle.id})? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await deleteBundlePrecoAction(bundle.id);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir bundle.");
    } finally {
      setSaving(false);
    }
  }

  const title = isCreate
    ? "Novo bundle"
    : canEdit
      ? "Editar bundle"
      : "Detalhes do bundle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {title}
            {!isCreate && bundle ? (
              <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                {bundle.id}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Pacote com preço único para um conjunto de módulos. Clique à direita
            para selecionar; à esquerda para remover.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {isCreate ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bundle-id">Identificador (slug)</Label>
              <Input
                id="bundle-id"
                value={bundleId}
                disabled={!canEdit}
                placeholder="ex.: varejo-fiscal-plus"
                className="font-mono text-sm"
                onChange={(e) => setBundleId(normalizePricingId(e.target.value))}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bundle-nome">Nome</Label>
            <Input
              id="bundle-nome"
              value={nome}
              disabled={!canEdit}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bundle-preco">Preço mensal (R$)</Label>
            <Input
              id="bundle-preco"
              value={preco}
              disabled={!canEdit}
              onChange={(e) => setPreco(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <ModulosBadgePicker
            modules={modules}
            selectedIds={modulosSelecionados}
            onSelectedChange={setModulosSelecionados}
            canEdit={canEdit}
          />

          <div className="flex flex-wrap items-center gap-3">
            {!isCreate ? <PlanoStatusBadge ativo={ativo} /> : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ativo}
                disabled={!canEdit || saving}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              {isCreate ? "Criar como ativo" : "Bundle ativo"}
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:items-center">
          {canEdit && !isCreate && bundle ? (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {canEdit ? "Cancelar" : "Fechar"}
            </Button>
            {canEdit ? (
              <Button type="button" disabled={saving} onClick={handleSave}>
                {saving ? "Salvando…" : isCreate ? "Criar bundle" : "Salvar"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
