"use client";

import * as React from "react";
import {
  getDashboardLayoutAction,
  listDashboardSectorsAction,
  saveDashboardLayoutAction,
} from "@/app/actions/dashboard-layout";
import {
  dashboardCardsByGroup,
  type DashboardCardId,
} from "@/lib/dashboard-cards";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function DashboardCardPickerColumns({
  selected,
  onToggle,
}: {
  selected: DashboardCardId[];
  onToggle: (id: DashboardCardId, checked: boolean) => void;
}) {
  const groups = dashboardCardsByGroup();
  const splitAt = Math.ceil(groups.length / 2);
  const columns = [groups.slice(0, splitAt), groups.slice(splitAt)];

  return (
    <div className="grid max-h-[min(52vh,480px)] min-h-[280px] flex-1 grid-cols-2 gap-0 overflow-hidden rounded-xl border">
      {columns.map((columnGroups, colIndex) => (
        <div
          key={colIndex}
          className={cn(
            "min-h-0 overflow-y-auto overscroll-contain p-3",
            colIndex === 1 && "border-l",
          )}
        >
          <div className="flex flex-col gap-4">
            {columnGroups.map(({ group, label, cards }) => (
              <section key={group} className="flex flex-col gap-2">
                <h3 className="sticky top-0 z-10 bg-popover py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {cards.map((card) => {
                    const checked = selected.includes(card.id);
                    const inputId = `dash-card-${card.id}`;
                    return (
                      <li
                        key={card.id}
                        className="flex gap-2.5 rounded-xl border p-2.5"
                      >
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          onCheckedChange={(v) =>
                            onToggle(card.id, Boolean(v))
                          }
                        />
                        <label
                          htmlFor={inputId}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="text-sm font-medium leading-snug">
                            {card.title}
                          </span>
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                            {card.description}
                          </p>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardEditDialog({
  open,
  onOpenChange,
  initialSectorSlug,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSectorSlug: string;
  onSaved?: () => void | Promise<void>;
}) {
  const [sectors, setSectors] = React.useState<
    Awaited<ReturnType<typeof listDashboardSectorsAction>>
  >([]);
  const [sectorSlug, setSectorSlug] = React.useState(initialSectorSlug);
  const [selected, setSelected] = React.useState<DashboardCardId[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setSectorSlug(initialSectorSlug);
    void listDashboardSectorsAction().then(setSectors);
  }, [open, initialSectorSlug]);

  React.useEffect(() => {
    if (!open || !sectorSlug) return;
    setLoading(true);
    setError(null);
    void getDashboardLayoutAction(sectorSlug)
      .then((layout) => setSelected(layout.cards))
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar.",
        );
      })
      .finally(() => setLoading(false));
  }, [open, sectorSlug]);

  function toggleCard(id: DashboardCardId, checked: boolean) {
    setSelected((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      const next = prev.filter((c) => c !== id);
      return next;
    });
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError("Selecione ao menos um card.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveDashboardLayoutAction(sectorSlug, selected);
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Editar dashboard</DialogTitle>
          <DialogDescription>
            Escolha o setor e os cards do painel inicial. Modelos pré-definidos
            por área (financeiro, comercial, estoque, equipe).
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
          <div className="shrink-0 grid gap-2">
            <Label>Setor</Label>
            <Select
              value={sectorSlug}
              onValueChange={(v) => setSectorSlug(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s.id} value={s.slug}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <DashboardCardPickerColumns
              selected={selected}
              onToggle={toggleCard}
            />
          )}

          {error ? (
            <p className="shrink-0 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || loading || selected.length === 0}
            onClick={() => void handleSave()}
          >
            {saving ? "Salvando…" : "Salvar painel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
