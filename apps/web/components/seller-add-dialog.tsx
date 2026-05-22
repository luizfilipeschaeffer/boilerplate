"use client";

import { SellerForm } from "@/components/seller-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SellerAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo vendedor</DialogTitle>
          <DialogDescription>
            Cadastre um membro da equipe e defina a comissão padrão.
          </DialogDescription>
        </DialogHeader>
        <SellerForm
          onSuccess={async () => {
            await onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
