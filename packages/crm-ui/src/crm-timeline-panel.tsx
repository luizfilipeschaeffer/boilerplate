"use client";

import type { CrmTimelineEntry } from "@boilerplate/crm";

export function CrmTimelinePanel({
  entries,
  loading,
}: {
  entries: CrmTimelineEntry[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando timeline…</p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="relative border-l-2 border-muted pl-4 pb-1"
        >
          <p className="text-sm font-medium">{entry.title}</p>
          {entry.body ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{entry.body}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.authorName ? `${entry.authorName} · ` : ""}
            {new Date(entry.createdAt).toLocaleString("pt-BR")}
          </p>
        </li>
      ))}
    </ul>
  );
}
