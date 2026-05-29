"use client";

import { useMemo } from "react";
import type { EventoCalendario } from "@boilerplate/civil-obras";
import Link from "next/link";
import { CIVIL_OBRAS_ROUTES } from "@/lib/civil-obras-access";

export function CalendarioObraClient({
  obraId,
  eventos,
}: {
  obraId: string;
  eventos: EventoCalendario[];
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const day = ev.dataEvento.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ev);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [eventos]);

  return (
    <div className="flex flex-col gap-3">
      {grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum evento no período.</p>
      ) : (
        grouped.map(([day, items]) => (
          <div key={day} className="rounded-md border p-3">
            <p className="mb-2 font-medium">{day}</p>
            <ul className="space-y-2 text-sm">
              {items.map((ev) => (
                <li key={ev.id}>
                  {ev.entradaId ? (
                    <Link
                      href={`${CIVIL_OBRAS_ROUTES.diario(obraId)}?entrada=${ev.entradaId}`}
                      className="text-primary hover:underline"
                    >
                      {ev.titulo}
                    </Link>
                  ) : (
                    <span>{ev.titulo}</span>
                  )}
                  <span className="text-muted-foreground ml-2">({ev.tipo})</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
