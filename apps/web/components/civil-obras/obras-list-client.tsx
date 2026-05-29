"use client";

import Link from "next/link";
import type { ObraSummary } from "@boilerplate/civil-obras";
import { CIVIL_OBRAS_ROUTES } from "@/lib/civil-obras-access";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ObrasListClient({
  obras,
  canAdmin,
}: {
  obras: ObraSummary[];
  canAdmin: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {canAdmin ? (
        <Link
          href={CIVIL_OBRAS_ROUTES.nova}
          className={cn(buttonVariants(), "w-fit")}
        >
          Nova obra
        </Link>
      ) : null}
      {obras.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma obra cadastrada.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {obras.map((obra) => (
            <li key={obra.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <Link
                  href={CIVIL_OBRAS_ROUTES.obra(obra.id)}
                  className="font-medium hover:underline"
                >
                  {obra.nome}
                </Link>
                <p className="text-muted-foreground text-sm">{obra.endereco}</p>
              </div>
              <Badge variant="secondary">{obra.status.replace("_", " ")}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
