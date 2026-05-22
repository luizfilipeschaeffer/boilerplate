"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import { MemberAddDialog } from "@/components/member-add-dialog";
import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export function MembrosHeaderToolbar({
  onMemberCreated,
}: {
  onMemberCreated?: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <SetHeaderActions>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Novo membro</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </SetHeaderActions>
      <MemberAddDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={onMemberCreated}
      />
    </>
  );
}
