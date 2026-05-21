"use client";

import { toggleAprendizChatAutomationAction } from "@/app/actions/aprendiz";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type AprendizTemplateRow = {
  id: string;
  nome: string;
  descricao: string;
  enabled: boolean;
};

export function AprendizChatAutomations({
  templates,
  disabled,
  onPendingChange,
  onUpdated,
}: {
  templates: AprendizTemplateRow[];
  disabled?: boolean;
  onPendingChange?: (pending: boolean) => void;
  onUpdated: (
    data: Awaited<ReturnType<typeof toggleAprendizChatAutomationAction>>,
  ) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {templates.map((t) => (
        <label
          key={t.id}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border bg-background/80 p-3",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <Checkbox
            checked={t.enabled}
            disabled={disabled}
            onCheckedChange={(checked) => {
              onPendingChange?.(true);
              void toggleAprendizChatAutomationAction(t.id, checked === true)
                .then(onUpdated)
                .catch(() => undefined)
                .finally(() => onPendingChange?.(false));
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{t.nome}</span>
              <Badge variant={t.enabled ? "default" : "secondary"}>
                {t.enabled ? "Ativa" : "Inativa"}
              </Badge>
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t.descricao}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
