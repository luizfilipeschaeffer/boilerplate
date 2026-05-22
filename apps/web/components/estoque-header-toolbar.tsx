"use client";

import * as React from "react";
import { ArrowDownUp } from "lucide-react";

import { SetHeaderActions } from "@/components/header-actions-context";
import type { StockProductRow } from "@/app/actions/stock";
import { StockMovementDialog } from "@/components/stock-movement-dialog";
import { Button } from "@/components/ui/button";

export function EstoqueHeaderToolbar({
  products,
  onChanged,
}: {
  products: StockProductRow[];
  onChanged?: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  if (products.length === 0) return null;

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" onClick={() => setOpen(true)}>
          <ArrowDownUp className="size-4" />
          <span className="hidden sm:inline">Registrar movimento</span>
          <span className="sm:hidden">Movimento</span>
        </Button>
      </SetHeaderActions>
      <StockMovementDialog
        open={open}
        onOpenChange={setOpen}
        products={products}
        onSuccess={onChanged}
      />
    </>
  );
}
