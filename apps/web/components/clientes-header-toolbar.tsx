"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";

import { ClientsAddDialog } from "@/components/clients-add-dialog";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export function ClientesHeaderToolbar() {
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
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Adicionar cliente</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </SetHeaderActions>
      <ClientsAddDialog open={open} onOpenChange={handleOpenChange} />
    </>
  );
}
