"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import { SellerAddDialog } from "@/components/seller-add-dialog";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export function VendedoresHeaderToolbar({
  onSellerCreated,
}: {
  onSellerCreated?: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Cadastrar vendedor</span>
          <span className="sm:hidden">Cadastrar</span>
        </Button>
      </SetHeaderActions>
      <SellerAddDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSellerCreated}
      />
    </>
  );
}
