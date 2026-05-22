"use client";

import type { CategoryDto } from "@/app/actions/categories";
import { CatalogForm } from "@/components/catalog-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CatalogAddDialog({
  open,
  onOpenChange,
  categories = [],
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: CategoryDto[];
  onSuccess?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo item</DialogTitle>
          <DialogDescription>
            Produto ou serviço com preço para usar nas vendas.
          </DialogDescription>
        </DialogHeader>
        <CatalogForm
          layout="stack"
          categories={categories}
          submitLabel="Adicionar item"
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
