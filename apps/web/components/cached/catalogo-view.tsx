"use client";

import * as React from "react";

import {
  expandCategoryIdsAction,
  listCategoriesAction,
  type CategoryDto,
} from "@/app/actions/categories";
import { CatalogCategoryTree } from "@/components/catalog-category-tree";
import { CatalogoHeaderToolbar } from "@/components/catalogo-header-toolbar";
import {
  CatalogDataTable,
  type CatalogRow,
} from "@/components/catalog-data-table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSyncContext } from "@/components/sync-provider";
import { useCachedStore } from "@/hooks/use-cached-store";
import { useIsLg } from "@/hooks/use-lg";
import { cn } from "@/lib/utils";
import type { CachedCatalogItem } from "@/lib/idb/types";
import { Spinner } from "@/components/ui/spinner";
import type { SegmentCatalogHint } from "@/lib/catalog-segment";

export function CatalogoCachedView({
  segmentHints = [],
}: {
  segmentHints?: SegmentCatalogHint[];
}) {
  const { requestSync } = useSyncContext();
  const { data, loading } = useCachedStore<CachedCatalogItem>("catalog");
  const [categories, setCategories] = React.useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = React.useState<string[] | null>(null);
  const [categoryPanelOpen, setCategoryPanelOpen] = React.useState(false);
  const isLg = useIsLg();

  const loadCategories = React.useCallback(async () => {
    const cats = await listCategoriesAction();
    setCategories(cats);
  }, []);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    if (!selectedCategoryId) {
      setExpandedIds(null);
      return;
    }
    void expandCategoryIdsAction(selectedCategoryId).then(setExpandedIds);
  }, [selectedCategoryId]);

  const items: CatalogRow[] = React.useMemo(() => {
    const mapped = data.map((row) => ({
      id: row.id,
      name: row.name,
      itemType: row.itemType,
      sku: row.sku,
      priceCents: row.priceCents,
      stockQty: row.stockQty,
      categoryId: row.categoryId ?? null,
      active: row.active ?? true,
    }));
    if (!expandedIds) return mapped;
    return mapped.filter(
      (row) => row.categoryId && expandedIds.includes(row.categoryId),
    );
  }, [data, expandedIds]);

  const categoryNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const selectedCategoryLabel = selectedCategoryId
    ? categoryNameById.get(selectedCategoryId) ?? null
    : null;

  const treeProps = {
    categories,
    selectedId: selectedCategoryId,
    onSelect: setSelectedCategoryId,
    onChanged: () => {
      void loadCategories();
      void requestSync();
    },
    onClose: () => setCategoryPanelOpen(false),
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-8 lg:px-6">
      <CatalogoHeaderToolbar categories={categories} onCatalogChanged={() => {
        void loadCategories();
        void requestSync();
      }} />
      {segmentHints.length > 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Campos sugeridos por segmento</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            {segmentHints.map((h) => (
              <li key={h.moduleId}>
                <span className="text-foreground">{h.label}:</span>{" "}
                {h.fields.map((f) => f.label).join(", ")} — use SKU/notas no
                cadastro até campos dedicados.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {loading ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Carregando catálogo…
        </div>
      ) : (
        <>
          <div
            className={cn(
              "grid min-h-0 flex-1 gap-4",
              categoryPanelOpen && isLg && "lg:grid-cols-[240px_1fr]",
            )}
          >
            {categoryPanelOpen && isLg ? (
              <CatalogCategoryTree {...treeProps} className="min-h-[280px]" />
            ) : null}
            <CatalogDataTable
              items={items}
              categories={categories}
              categoryNameById={categoryNameById}
              categoryPanelOpen={categoryPanelOpen}
              onToggleCategoryPanel={() => setCategoryPanelOpen((o) => !o)}
              selectedCategoryLabel={selectedCategoryLabel}
              onClearCategoryFilter={() => setSelectedCategoryId(null)}
            />
          </div>

          <Sheet
            open={categoryPanelOpen && !isLg}
            onOpenChange={setCategoryPanelOpen}
          >
            <SheetContent side="left" className="w-[min(100%,280px)] p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle>Categorias</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-hidden p-3">
                <CatalogCategoryTree {...treeProps} className="h-full border-0 p-0" />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
