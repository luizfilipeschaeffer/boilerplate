"use client";

import * as React from "react";
import {
  confirmPhaseExpansionAction,
  dismissPhaseExpansionAction,
  getPhaseExpansionStatusAction,
} from "@/app/actions/phase-expansion";
import { FASE_DEFINITIONS } from "@/lib/diagnostico/phase-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

export function PhaseExpansionWizard() {
  const [open, setOpen] = React.useState(false);
  const [pendingPhase, setPendingPhase] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const status = await getPhaseExpansionStatusAction();
        setPendingPhase(status.pendingPhase);
        setOpen(status.pendingPhase != null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const phaseDef = FASE_DEFINITIONS.find(
    (f) => f.phase === pendingPhase,
  );

  async function onConfirm() {
    if (!pendingPhase) return;
    setConfirming(true);
    try {
      await confirmPhaseExpansionAction(pendingPhase);
      setOpen(false);
      setPendingPhase(null);
    } finally {
      setConfirming(false);
    }
  }

  async function onDismiss() {
    setConfirming(true);
    try {
      await dismissPhaseExpansionAction();
      setOpen(false);
      setPendingPhase(null);
    } finally {
      setConfirming(false);
    }
  }

  if (loading || !pendingPhase) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Expansão disponível
            <Badge variant="secondary">P{pendingPhase}</Badge>
          </DialogTitle>
          <DialogDescription>
            {phaseDef?.label ?? `Fase P${pendingPhase}`} — novos setores e
            módulos estão prontos para ativação. Confirme para liberar na sua
            operação.
          </DialogDescription>
        </DialogHeader>
        {phaseDef?.description ? (
          <p className="text-muted-foreground text-sm">{phaseDef.description}</p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={confirming}
            onClick={() => void onDismiss()}
          >
            Agora não
          </Button>
          <Button
            type="button"
            disabled={confirming}
            onClick={() => void onConfirm()}
          >
            {confirming ? <Spinner className="size-4" /> : "Ativar expansão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
