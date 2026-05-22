"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryDto } from "@/app/actions/categories";

const NONE = "__none__";

export function CatalogCategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: CategoryDto[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
}) {
  const roots = categories.filter((c) => !c.parentId && c.active);
  const subs = categories.filter((c) => c.parentId && c.active);

  const options: { id: string; label: string }[] = [];
  for (const root of roots) {
    options.push({ id: root.id, label: root.name });
    for (const sub of subs.filter((s) => s.parentId === root.id)) {
      options.push({ id: sub.id, label: `${root.name} › ${sub.name}` });
    }
  }

  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sem categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sem categoria</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
