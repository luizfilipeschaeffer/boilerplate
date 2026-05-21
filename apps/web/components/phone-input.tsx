"use client";

import { Input } from "@/components/ui/input";
import {
  DEFAULT_COUNTRY_CODE,
  digitsOnly,
  formatLocalNumberDigits,
  phonePartsEqual,
  type PhoneParts,
} from "@/lib/format-phone";
import { cn } from "@/lib/utils";

export function PhoneInput({
  parts,
  onPartsChange,
  disabled,
  className,
}: {
  parts: PhoneParts;
  onPartsChange: (parts: PhoneParts) => void;
  disabled?: boolean;
  className?: string;
}) {
  function update(patch: Partial<PhoneParts>) {
    const next = { ...parts, ...patch };
    if (phonePartsEqual(next, parts)) return;
    onPartsChange(next);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <div className="flex w-[5.5rem] shrink-0 items-center gap-1">
        <span className="text-sm text-muted-foreground" aria-hidden>
          +
        </span>
        <Input
          inputMode="numeric"
          aria-label="Código do país"
          placeholder={DEFAULT_COUNTRY_CODE}
          value={parts.countryCode}
          disabled={disabled}
          className="px-2"
          onChange={(e) =>
            update({ countryCode: digitsOnly(e.target.value, 3) })
          }
        />
      </div>
      <Input
        inputMode="numeric"
        aria-label="DDD"
        placeholder="DDD"
        value={parts.ddd}
        disabled={disabled}
        className="w-16 shrink-0"
        onChange={(e) => update({ ddd: digitsOnly(e.target.value, 2) })}
      />
      <Input
        inputMode="numeric"
        aria-label="Número"
        placeholder="9 8765-4321"
        value={formatLocalNumberDigits(parts.number)}
        disabled={disabled}
        className="min-w-0 flex-1"
        onChange={(e) =>
          update({ number: digitsOnly(e.target.value, 9) })
        }
      />
    </div>
  );
}
