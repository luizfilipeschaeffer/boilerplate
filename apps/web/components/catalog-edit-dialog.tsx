"use client";

import type { CategoryDto } from "@/app/actions/categories";
import { CatalogForm, type CatalogFormValues } from "@/components/catalog-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CatalogEditDialog({
  open,
  onOpenChange,
  itemId,
  initialValues,
  categories = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  initialValues: CatalogFormValues;
  categories?: CategoryDto[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription>
            Atualize nome, tipo, SKU ou preço.
          </DialogDescription>
        </DialogHeader>
        <CatalogForm
          key={itemId}
          layout="stack"
          itemId={itemId}
          initialValues={initialValues}
          categories={categories}
          submitLabel="Salvar alterações"
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
