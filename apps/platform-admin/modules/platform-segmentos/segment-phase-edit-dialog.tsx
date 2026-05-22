"use client";

import type { SegmentPhaseConfigRow } from "@boilerplate/db";
import type { ModuleDefinition } from "@boilerplate/shared";
import { useEffect, useState } from "react";
import { ModulosBadgePicker } from "@/modules/platform-modulos/modulos-badge-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { saveSegmentPhaseAction } from "./actions";

export const FASE_LABELS: Record<number, string> = {
  1: "P1 — Informal",
  2: "P2 — Crescendo",
  3: "P3 — Estabelecido",
  4: "P4 — Escala",
};

function defaultForm(phase: number, cfg: SegmentPhaseConfigRow | null) {
  return {
    bundlePrecoId: cfg?.bundlePrecoId ?? "",
    moduleIds: cfg?.moduleIds ?? [],
    requiresPaymentValidation: cfg?.requiresPaymentValidation ?? phase >= 3,
    preActivateModules: cfg?.preActivateModules ?? true,
    trialDays: String(cfg?.trialDays ?? 14),
    ativo: cfg?.ativo !== false,
  };
}

export function SegmentPhaseEditDialog({
  segmentSlug,
  segmentName,
  phase,
  config,
  modules,
  open,
  onOpenChange,
  canEdit,
  onSaved,
}: {
  segmentSlug: string;
  segmentName: string;
  phase: number | null;
  config: SegmentPhaseConfigRow | null;
  modules: ModuleDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onSaved?: () => void;
}) {
  const [bundlePrecoId, setBundlePrecoId] = useState("");
  const [modulosSelecionados, setModulosSelecionados] = useState<Set<string>>(
    new Set(),
  );
  const [requiresPaymentValidation, setRequiresPaymentValidation] =
    useState(false);
  const [preActivateModules, setPreActivateModules] = useState(true);
  const [trialDays, setTrialDays] = useState("14");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || phase == null) return;
    const f = defaultForm(phase, config);
    setBundlePrecoId(f.bundlePrecoId);
    setModulosSelecionados(new Set(f.moduleIds));
    setRequiresPaymentValidation(f.requiresPaymentValidation);
    setPreActivateModules(f.preActivateModules);
    setTrialDays(f.trialDays);
    setAtivo(f.ativo);
    setError(null);
  }, [open, phase, config]);

  async function handleSave() {
    if (!canEdit || phase == null) return;
    const days = Number(trialDays);
    if (Number.isNaN(days) || days < 0 || days > 90) {
      setError("Dias de trial deve ser entre 0 e 90.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveSegmentPhaseAction({
        segmentSlug,
        phase,
        bundlePrecoId: bundlePrecoId.trim() || null,
        moduleIds: [...modulosSelecionados].sort(),
        requiresPaymentValidation,
        trialDays: days,
        preActivateModules,
        ativo,
      });
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const title =
    phase != null
      ? canEdit
        ? `Editar ${FASE_LABELS[phase]}`
        : FASE_LABELS[phase]
      : "Fase";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {segmentName}{" "}
            <span className="font-mono text-xs">({segmentSlug})</span>
            — pacote de módulos, trial e regras de pagamento para esta fase.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="phase-bundle">Bundle (id)</Label>
            <Input
              id="phase-bundle"
              value={bundlePrecoId}
              disabled={!canEdit || saving}
              placeholder="opcional — ex.: varejo-fiscal"
              className="font-mono text-sm"
              onChange={(e) => setBundlePrecoId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Os módulos do bundle são somados aos habilitados à
              direita na ativação.
            </p>
          </div>

          <ModulosBadgePicker
            modules={modules}
            selectedIds={modulosSelecionados}
            onSelectedChange={setModulosSelecionados}
            canEdit={canEdit && !saving}
            label="Módulos da fase"
            displayMode="list"
            availableFirst
            availableTitle="Disponíveis"
            selectedTitle="Habilitados nesta fase"
          />

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={requiresPaymentValidation}
                disabled={!canEdit || saving}
                onCheckedChange={(c) =>
                  setRequiresPaymentValidation(c === true)
                }
              />
              Exige validação de pagamento antes do trial
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={preActivateModules}
                disabled={!canEdit || saving}
                onCheckedChange={(c) => setPreActivateModules(c === true)}
              />
              Pré-ativação (módulos core antes do pagamento)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={ativo}
                disabled={!canEdit || saving}
                onCheckedChange={(c) => setAtivo(c === true)}
              />
              Configuração ativa
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phase-trial">Dias de trial</Label>
            <Input
              id="phase-trial"
              type="number"
              min={0}
              max={90}
              value={trialDays}
              disabled={!canEdit || saving}
              className="w-28"
              onChange={(e) => setTrialDays(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {canEdit ? "Cancelar" : "Fechar"}
          </Button>
          {canEdit ? (
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
