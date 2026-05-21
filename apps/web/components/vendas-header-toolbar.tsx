"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";

import { SalesAddDialog } from "@/components/sales-add-dialog";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export type SalesFormData = {
  clients: { id: string; name: string }[];
  sellers?: { id: string; name: string }[];
  items: {
    id: string;
    name: string;
    priceCents: number | null;
    itemType: string;
    stockQty: number;
  }[];
};

export function VendasHeaderToolbar({ formData }: { formData: SalesFormData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const autoOpen = searchParams.get("novo") === "1";
  const [userOpen, setUserOpen] = React.useState(false);
  const open = autoOpen || userOpen;

  function handleOpenChange(next: boolean) {
    setUserOpen(next);
    if (!next && autoOpen) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("novo");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" onClick={() => setUserOpen(true)}>
          <Receipt className="size-4" />
          <span className="hidden sm:inline">Registrar venda</span>
          <span className="sm:hidden">Registrar</span>
        </Button>
      </SetHeaderActions>
      <SalesAddDialog
        open={open}
        onOpenChange={handleOpenChange}
        data={formData}
      />
    </>
  );
}
