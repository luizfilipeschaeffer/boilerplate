"use client";

import * as React from "react";
import { ChevronDown, Info } from "lucide-react";

import type { ChoiceOption } from "@/lib/chat/choice-option";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

const SCROLL_END_THRESHOLD_PX = 8;

function useScrollOverflowHint(optionCount: number) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showMoreBelow, setShowMoreBelow] = React.useState(false);

  const updateHint = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setShowMoreBelow(false);
      return;
    }
    const hasOverflow = el.scrollHeight > el.clientHeight + 1;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <=
      SCROLL_END_THRESHOLD_PX;
    setShowMoreBelow(hasOverflow && !atBottom);
  }, []);

  React.useEffect(() => {
    updateHint();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateHint, { passive: true });
    const observer = new ResizeObserver(updateHint);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateHint);
      observer.disconnect();
    };
  }, [optionCount, updateHint]);

  return { scrollRef, showMoreBelow };
}

export function ChatChoiceList({
  options,
  onSelect,
  disabled,
}: {
  options: ChoiceOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const { scrollRef, showMoreBelow } = useScrollOverflowHint(options.length);

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className="flex max-h-[min(240px,32vh)] w-full flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5"
        aria-label="Opções de resposta"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex shrink-0 items-stretch gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="h-auto min-h-9 flex-1 whitespace-normal py-2.5 text-left font-medium"
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
            </Button>
            {opt.description ? (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={disabled}
                      className="shrink-0 text-muted-foreground"
                      aria-label={`Saiba mais sobre: ${opt.label}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="size-4" />
                    </Button>
                  }
                />
                <PopoverContent className="max-w-xs text-sm" side="top">
                  <PopoverHeader>
                    <PopoverTitle className="text-sm">{opt.label}</PopoverTitle>
                    <PopoverDescription>{opt.description}</PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        ))}
      </div>

      {showMoreBelow ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-0.5 pt-8"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <ChevronDown className="relative size-5 animate-bounce text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
