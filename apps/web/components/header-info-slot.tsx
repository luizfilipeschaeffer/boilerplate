"use client";

import { Info } from "lucide-react";

import { HeaderActionsContext } from "@/components/header-actions-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";

export function HeaderInfoSlot() {
  const info = React.useContext(HeaderActionsContext)?.info;
  if (!info) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label="Informações sobre esta página"
            />
          }
        >
          <Info className="size-4" aria-hidden />
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-sm">
          {info}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
