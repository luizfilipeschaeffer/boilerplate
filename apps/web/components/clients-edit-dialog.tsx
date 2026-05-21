"use client";

import type { ClientFormValues } from "@/components/clients-form";
import { ClientsForm } from "@/components/clients-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ClientsEditDialog({
  open,
  onOpenChange,
  clientId,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialValues: ClientFormValues;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Atualize nome e contato. Para remover da lista, use inativar.
          </DialogDescription>
        </DialogHeader>
        <ClientsForm
          key={clientId}
          layout="stack"
          clientId={clientId}
          initialValues={initialValues}
          submitLabel="Salvar alterações"
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
