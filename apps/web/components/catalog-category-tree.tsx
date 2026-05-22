"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryDto,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DialogMode = "create" | "edit";

export function CatalogCategoryTree({
  categories,
  selectedId,
  onSelect,
  onChanged,
  onClose,
  className,
}: {
  categories: CategoryDto[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChanged: () => void;
  onClose?: () => void;
  className?: string;
}) {
  const roots = categories.filter((c) => !c.parentId && c.active);
  const [expandedRoots, setExpandedRoots] = React.useState<Set<string>>(() => {
    return new Set(roots.map((r) => r.id));
  });

  React.useEffect(() => {
    const activeRoots = categories.filter((c) => !c.parentId && c.active);
    if (activeRoots.length === 0) return;
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const r of activeRoots) {
        if (!next.has(r.id)) {
          next.add(r.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [categories]);

  function toggleRootExpanded(rootId: string) {
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });
  }
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>("create");
  const [parentForNew, setParentForNew] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const editingCategory = editingId
    ? categories.find((c) => c.id === editingId)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    try {
      if (dialogMode === "edit" && editingId) {
        await updateCategoryAction(editingId, { name: name.trim() });
      } else {
        await createCategoryAction({
          name: name.trim(),
          parentId: parentForNew,
        });
      }
      setName("");
      setEditingId(null);
      setDialogOpen(false);
      onChanged();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta categoria? Itens ficarão sem categoria.")) return;
    await deleteCategoryAction(id);
    if (selectedId === id) onSelect(null);
    onChanged();
  }

  function openCreate(parentId: string | null) {
    setDialogMode("create");
    setParentForNew(parentId);
    setEditingId(null);
    setName("");
    setDialogOpen(true);
  }

  function openEdit(category: CategoryDto) {
    setDialogMode("edit");
    setEditingId(category.id);
    setParentForNew(category.parentId);
    setName(category.name);
    setDialogOpen(true);
  }

  function CategoryOptionsMenu({
    category,
    isRoot,
  }: {
    category: CategoryDto;
    isRoot: boolean;
  }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Opções de {category.name}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => openEdit(category)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          {isRoot ? (
            <DropdownMenuItem onClick={() => openCreate(category.id)}>
              <Plus className="size-4" />
              Nova subcategoria
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void handleDelete(category.id)}
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const dialogTitle =
    dialogMode === "edit"
      ? editingCategory?.parentId
        ? "Editar subcategoria"
        : "Editar categoria"
      : parentForNew
        ? "Nova subcategoria"
        : "Nova categoria";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-2 rounded-lg border bg-card p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Categorias</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openCreate(null)}
          >
            <Plus className="size-3.5" />
            Nova
          </Button>
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              title="Recolher categorias"
              onClick={onClose}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className={cn(
          "rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
          selectedId === null && "bg-muted font-medium",
        )}
        onClick={() => onSelect(null)}
      >
        Todos os itens
      </button>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {roots.map((root) => {
          const children = categories.filter(
            (c) => c.parentId === root.id && c.active,
          );
          const hasChildren = children.length > 0;
          const isExpanded = expandedRoots.has(root.id);

          return (
            <div key={root.id}>
              <div className="group flex items-center gap-0.5">
                {hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    title={isExpanded ? "Recolher" : "Expandir"}
                    onClick={() => toggleRootExpanded(root.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </Button>
                ) : (
                  <span className="size-7 shrink-0" aria-hidden />
                )}
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                    selectedId === root.id && "bg-muted font-medium",
                  )}
                  onClick={() => onSelect(root.id)}
                >
                  <FolderTree className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{root.name}</span>
                </button>
                <CategoryOptionsMenu category={root} isRoot={true} />
              </div>
              {isExpanded
                ? children.map((sub) => (
                <div
                  key={sub.id}
                  className="group ml-3 flex items-center gap-0.5"
                >
                  <button
                    type="button"
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      selectedId === sub.id && "bg-muted font-medium",
                    )}
                    onClick={() => onSelect(sub.id)}
                  >
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{sub.name}</span>
                  </button>
                  <CategoryOptionsMenu category={sub} isRoot={false} />
                </div>
              ))
                : null}
            </div>
          );
        })}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setDialogMode("create");
          }
        }}
      >
        <DialogContent>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Salvando…"
                  : dialogMode === "edit"
                    ? "Salvar"
                    : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
