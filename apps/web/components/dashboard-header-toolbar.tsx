"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { DashboardEditDialog } from "@/components/dashboard-edit-dialog";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export function DashboardHeaderToolbar({
  canEdit,
  sectorSlug,
}: {
  canEdit: boolean;
  sectorSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  if (!canEdit) return null;

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <LayoutDashboard className="size-4" />
          <span className="hidden sm:inline">Editar dashboard</span>
          <span className="sm:hidden">Editar</span>
        </Button>
      </SetHeaderActions>
      <DashboardEditDialog
        open={open}
        onOpenChange={setOpen}
        initialSectorSlug={sectorSlug}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
