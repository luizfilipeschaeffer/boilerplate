"use client";

import { Input } from "@/components/ui/input";

export function ModulosDataTableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-md"
    />
  );
}
