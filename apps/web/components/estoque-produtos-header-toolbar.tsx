"use client";

import { Save } from "lucide-react";

import { SetHeaderActions } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";

export function EstoqueProdutosHeaderToolbar({
  pendingCount,
  saving,
  onSave,
}: {
  pendingCount: number;
  saving: boolean;
  onSave: () => void;
}) {
  if (pendingCount === 0 && !saving) return null;

  return (
    <SetHeaderActions>
      <Button size="sm" onClick={onSave} disabled={saving}>
        <Save className="size-4" />
        <span className="hidden sm:inline">
          {saving ? "Salvando…" : `Salvar alterações (${pendingCount})`}
        </span>
        <span className="sm:hidden">{saving ? "Salvando…" : "Salvar"}</span>
      </Button>
    </SetHeaderActions>
  );
}
