"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { CashFlowAddDialog } from "@/components/cash-flow-add-dialog";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export function FluxoCaixaHeaderToolbar({
  onEntryCreated,
}: {
  onEntryCreated?: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Adicionar lançamento</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </SetHeaderActions>
      <CashFlowAddDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={onEntryCreated}
      />
    </>
  );
}
