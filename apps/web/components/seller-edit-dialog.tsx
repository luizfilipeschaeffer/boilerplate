"use client";

import {
  SellerForm,
  type SellerFormValues,
} from "@/components/seller-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SellerEditDialog({
  open,
  onOpenChange,
  sellerId,
  initialValues,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  initialValues: SellerFormValues;
  onSuccess?: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar vendedor</DialogTitle>
          <DialogDescription>
            Atualize nome, e-mail ou comissão padrão.
          </DialogDescription>
        </DialogHeader>
        <SellerForm
          key={sellerId}
          sellerId={sellerId}
          initialValues={initialValues}
          submitLabel="Salvar alterações"
          onSuccess={async () => {
            await onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
