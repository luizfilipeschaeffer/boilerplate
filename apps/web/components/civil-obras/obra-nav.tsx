import Link from "next/link";
import { CIVIL_OBRAS_ROUTES } from "@/lib/civil-obras-access";

export function ObraNav({ obraId }: { obraId: string }) {
  const links = [
    { href: CIVIL_OBRAS_ROUTES.obra(obraId), label: "Visão geral" },
    { href: CIVIL_OBRAS_ROUTES.diario(obraId), label: "Diário" },
    { href: CIVIL_OBRAS_ROUTES.calendario(obraId), label: "Calendário" },
    { href: CIVIL_OBRAS_ROUTES.relatorio(obraId), label: "Relatórios" },
    { href: CIVIL_OBRAS_ROUTES.busca(obraId), label: "Busca" },
    { href: CIVIL_OBRAS_ROUTES.usuarios(obraId), label: "Usuários" },
  ];
  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
