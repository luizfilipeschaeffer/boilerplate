"use client";

import * as React from "react";
import {
  getCommandPaletteShortcutsAction,
  getSectorCommandPaletteShortcutsAction,
  listCommandPaletteSectorsAction,
  resetUserCommandPaletteShortcutsAction,
  saveSectorCommandPaletteShortcutsAction,
  saveUserCommandPaletteShortcutsAction,
} from "@/app/actions/command-palette-shortcuts";
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

type CatalogGroup = Awaited<
  ReturnType<typeof getCommandPaletteShortcutsAction>
>["catalogGroups"][number];

function ShortcutPickerColumns({
  catalogGroups,
  selected,
  onToggle,
}: {
  catalogGroups: CatalogGroup[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const splitAt = Math.ceil(catalogGroups.length / 2);
  const columns = [
    catalogGroups.slice(0, splitAt),
    catalogGroups.slice(splitAt),
  ];

  return (
    <div className="grid max-h-[min(52vh,420px)] min-h-[240px] flex-1 grid-cols-2 gap-0 overflow-hidden rounded-xl border">
      {columns.map((columnGroups, colIndex) => (
        <div
          key={colIndex}
          className={cn(
            "min-h-0 overflow-y-auto overscroll-contain p-3",
            colIndex === 1 && "border-l",
          )}
        >
          <div className="flex flex-col gap-4">
            {columnGroups.map(({ group, label, shortcuts }) => (
              <section key={group} className="flex flex-col gap-2">
                <h3 className="sticky top-0 z-10 bg-popover py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {shortcuts.map((shortcut) => {
                    const checked = selected.includes(shortcut.id);
                    const inputId = `shortcut-${shortcut.id}`;
                    return (
                      <li
                        key={shortcut.id}
                        className="flex gap-2.5 rounded-xl border p-2.5"
                      >
                        <Checkbox
                          id={inputId}
                          checked={checked}
                          onCheckedChange={(v) =>
                            onToggle(shortcut.id, Boolean(v))
                          }
                        />
                        <label
                          htmlFor={inputId}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="text-sm font-medium leading-snug">
                            {shortcut.label}
                          </span>
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                            {shortcut.description}
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

export function CommandPaletteShortcutsDialog({
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
  const [mode, setMode] = React.useState<"user" | "sector">("user");
  const [sectors, setSectors] = React.useState<
    Awaited<ReturnType<typeof listCommandPaletteSectorsAction>>
  >([]);
  const [sectorSlug, setSectorSlug] = React.useState(initialSectorSlug);
  const [catalogGroups, setCatalogGroups] = React.useState<CatalogGroup[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [canEditSector, setCanEditSector] = React.useState(false);
  const [hasPersonalOverride, setHasPersonalOverride] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadLayout = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = await getCommandPaletteShortcutsAction(sectorSlug);
      setCatalogGroups(base.catalogGroups);
      setCanEditSector(base.canEditSector);
      setHasPersonalOverride(base.hasPersonalOverride);

      if (mode === "sector" && base.canEditSector) {
        const sector = await getSectorCommandPaletteShortcutsAction(sectorSlug);
        setSelected(sector.shortcuts);
      } else {
        setSelected(base.userShortcuts ?? base.effectiveShortcuts);
        setHasPersonalOverride(base.hasPersonalOverride);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível carregar.",
      );
    } finally {
      setLoading(false);
    }
  }, [mode, sectorSlug]);

  React.useEffect(() => {
    if (!open) return;
    setSectorSlug(initialSectorSlug);
    setMode("user");
  }, [open, initialSectorSlug]);

  React.useEffect(() => {
    if (!open) return;
    void loadLayout();
  }, [open, loadLayout]);

  React.useEffect(() => {
    if (!open || !canEditSector) return;
    void listCommandPaletteSectorsAction().then(setSectors).catch(() => {});
  }, [open, canEditSector]);

  function toggleShortcut(id: string, checked: boolean) {
    setSelected((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((s) => s !== id);
    });
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError("Selecione ao menos um atalho.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "sector") {
        await saveSectorCommandPaletteShortcutsAction(sectorSlug, selected);
      } else {
        await saveUserCommandPaletteShortcutsAction(selected);
      }
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToSector() {
    setSaving(true);
    setError(null);
    try {
      await resetUserCommandPaletteShortcutsAction();
      await onSaved?.();
      await loadLayout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível restaurar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,680px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Editar atalhos</DialogTitle>
          <DialogDescription>
            Personalize as ações rápidas da paleta (Alt+P). O padrão do setor
            vale para todos; cada usuário pode ter sua própria lista.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "user" ? "default" : "outline"}
              onClick={() => setMode("user")}
            >
              Meus atalhos
            </Button>
            {canEditSector ? (
              <Button
                type="button"
                size="sm"
                variant={mode === "sector" ? "default" : "outline"}
                onClick={() => setMode("sector")}
              >
                Padrão do setor
              </Button>
            ) : null}
          </div>

          {mode === "sector" && canEditSector ? (
            <div className="shrink-0 grid gap-2">
              <Label>Setor</Label>
              <Select value={sectorSlug} onValueChange={setSectorSlug}>
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
          ) : (
            <p className="text-xs text-muted-foreground">
              {hasPersonalOverride
                ? "Você está usando uma lista personalizada."
                : "Usando o padrão do setor atual."}
            </p>
          )}

          {loading ? (
            <div className="flex min-h-[240px] flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <ShortcutPickerColumns
              catalogGroups={catalogGroups}
              selected={selected}
              onToggle={toggleShortcut}
            />
          )}

          {error ? (
            <p className="shrink-0 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:items-center">
          {mode === "user" && hasPersonalOverride ? (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto w-full sm:w-auto"
              disabled={saving}
              onClick={() => void handleResetToSector()}
            >
              Usar padrão do setor
            </Button>
          ) : (
            <span className="mr-auto hidden sm:block" />
          )}
          <div className="flex w-full justify-end gap-2 sm:w-auto">
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
              {saving ? "Salvando…" : "Salvar atalhos"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
