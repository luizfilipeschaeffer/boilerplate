"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  registerStockMovementsAction,
  type StockMovementLineInput,
} from "@/app/actions/stock";
import { useSyncContext } from "@/components/sync-provider";
import type { StockProductRow } from "@/app/actions/stock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createIdempotencyKey } from "@/lib/idempotency-key";

type StockMovementType = "entrada" | "ajuste";

type MovementLine = {
  lineId: string;
  catalogItemId: string;
  quantity: string;
};

type FormState = {
  movementType: StockMovementType;
  note: string;
  lines: MovementLine[];
};

function newLine(): MovementLine {
  return {
    lineId: createIdempotencyKey(),
    catalogItemId: "",
    quantity: "1",
  };
}

function emptyFormState(): FormState {
  return {
    movementType: "entrada",
    note: "",
    lines: [newLine()],
  };
}

function serializeForm(state: FormState): string {
  return JSON.stringify({
    movementType: state.movementType,
    note: state.note.trim(),
    lines: state.lines.map((l) => ({
      catalogItemId: l.catalogItemId,
      quantity: l.quantity,
    })),
  });
}

function isFormDirty(state: FormState, baseline: string): boolean {
  return serializeForm(state) !== baseline;
}

function productLabel(p: StockProductRow) {
  return `${p.name} (${p.stockQty} un.)`;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: StockProductRow[];
  onSuccess?: () => void | Promise<void>;
}) {
  const { requestSync } = useSyncContext();
  const [form, setForm] = React.useState<FormState>(emptyFormState);
  const [baseline, setBaseline] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = React.useState(false);

  const productById = React.useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  React.useEffect(() => {
    if (open) {
      const initial = emptyFormState();
      setForm(initial);
      setBaseline(serializeForm(initial));
      setError(null);
      setDiscardOpen(false);
    }
  }, [open]);

  const dirty = open && isFormDirty(form, baseline);

  function requestClose() {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function handleDialogOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    requestClose();
  }

  function confirmDiscard() {
    setDiscardOpen(false);
    onOpenChange(false);
  }

  function updateLine(lineId: string, patch: Partial<MovementLine>) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.lineId === lineId ? { ...l, ...patch } : l,
      ),
    }));
  }

  function handleProductChange(lineId: string, catalogItemId: string) {
    updateLine(lineId, { catalogItemId });
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, newLine()],
    }));
  }

  function removeLine(lineId: string) {
    setForm((prev) => {
      const next = prev.lines.filter((l) => l.lineId !== lineId);
      return {
        ...prev,
        lines: next.length > 0 ? next : [newLine()],
      };
    });
  }

  function usedProductIds(exceptLineId?: string) {
    return new Set(
      form.lines
        .filter((l) => l.lineId !== exceptLineId && l.catalogItemId)
        .map((l) => l.catalogItemId),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: StockMovementLineInput[] = [];
    for (const line of form.lines) {
      if (!line.catalogItemId) continue;
      const qty = parseInt(line.quantity, 10);
      if (!qty || qty < 0) {
        setError("Informe quantidades válidas em todos os produtos.");
        return;
      }
      payload.push({
        catalogItemId: line.catalogItemId,
        quantity: qty,
      });
    }

    if (payload.length === 0) {
      setError("Selecione ao menos um produto.");
      return;
    }

    setPending(true);
    try {
      await registerStockMovementsAction({
        movementType: form.movementType,
        note: form.note.trim() || null,
        lines: payload,
      });
      await requestSync();
      await onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar os movimentos.",
      );
    } finally {
      setPending(false);
    }
  }

  const quantityLabel =
    form.movementType === "ajuste" ? "Novo saldo" : "Quantidade";

  const selectedCount = form.lines.filter((l) => l.catalogItemId).length;
  const submitLabel = pending
    ? "Salvando…"
    : selectedCount <= 1
      ? "Registrar movimento"
      : `Registrar ${selectedCount} movimentos`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Registrar movimento</DialogTitle>
            <DialogDescription>
              Entrada ou ajuste de saldo para um ou mais produtos. Estoque mínimo é
              definido em Estoque → Produtos.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <FieldGroup className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Movimento</FieldLabel>
                    <Select
                      value={form.movementType}
                      onValueChange={(v) =>
                        setForm((prev) => ({
                          ...prev,
                          movementType: (v ?? "entrada") as StockMovementType,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="ajuste">
                          Ajuste (definir saldo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Observação</FieldLabel>
                    <Input
                      value={form.note}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      placeholder="Opcional — vale para todos"
                    />
                  </Field>
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  {form.lines.map((line, index) => {
                    const selected = productById.get(line.catalogItemId);
                    const taken = usedProductIds(line.lineId);
                    const available = products.filter(
                      (p) => !taken.has(p.id) || p.id === line.catalogItemId,
                    );

                    return (
                      <div
                        key={line.lineId}
                        className="rounded-xl border bg-muted/20 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            Produto {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            disabled={pending || form.lines.length === 1}
                            onClick={() => removeLine(line.lineId)}
                            aria-label={`Remover produto ${index + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field className="sm:col-span-2">
                            <FieldLabel>Produto</FieldLabel>
                            <Select
                              value={line.catalogItemId}
                              onValueChange={(v) =>
                                handleProductChange(line.lineId, v ?? "")
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione um produto">
                                  {selected ? productLabel(selected) : null}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {available.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {productLabel(p)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selected ? (
                              <p className="text-xs text-muted-foreground">
                                Saldo atual: {selected.stockQty} un.
                                {selected.isLow ? " — abaixo do mínimo" : ""}
                              </p>
                            ) : null}
                          </Field>

                          <Field className="sm:col-span-2">
                            <FieldLabel>{quantityLabel}</FieldLabel>
                            <Input
                              type="number"
                              min={0}
                              value={line.quantity}
                              disabled={!line.catalogItemId}
                              onChange={(e) =>
                                updateLine(line.lineId, {
                                  quantity: e.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  disabled={pending || form.lines.length >= products.length}
                  onClick={addLine}
                >
                  <Plus className="size-4" />
                  Adicionar produto
                </Button>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={pending}
                onClick={requestClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={pending || selectedCount === 0}
              >
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Há dados preenchidos neste formulário. Se sair agora, nenhum
              movimento será registrado e as alterações serão perdidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDiscardOpen(false)}
            >
              Continuar editando
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={confirmDiscard}
            >
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
