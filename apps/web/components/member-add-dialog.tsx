"use client";

import { MemberForm } from "@/components/member-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MemberAddDialog({
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
          <DialogTitle>Novo membro</DialogTitle>
          <DialogDescription>
            Cadastro na organização. Enviamos um e-mail com o e-mail de login, o
            papel na equipe e um link para criar a senha no primeiro acesso.
          </DialogDescription>
        </DialogHeader>
        <MemberForm
          onSuccess={async () => {
            await onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
