"use client";

import { SalesForm } from "@/components/sales-form";
import type { SalesFormData } from "@/components/vendas-header-toolbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SalesAddDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SalesFormData;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova venda</DialogTitle>
          <DialogDescription>
            Escolha cliente, item e forma de pagamento.
          </DialogDescription>
        </DialogHeader>
        <SalesForm
          layout="stack"
          data={data}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
