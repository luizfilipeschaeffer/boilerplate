import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/configuracoes/membros", title: "Membros", desc: "Equipe, setores de acesso, módulos e permissões." },
  { href: "/configuracoes/setores", title: "Setores", desc: "Departamentos e módulos disponíveis em cada setor." },
  { href: "/configuracoes/filiais", title: "Filiais", desc: "Multi-loja e filial ativa na sidebar." },
  { href: "/configuracoes/pagamentos", title: "Pagamentos", desc: "Formas aceitas nos pedidos e vendas." },
];

export default function ConfiguracoesPage() {
  return (
    <div className="grid gap-4 px-4 pb-8 lg:grid-cols-3 lg:px-6">
      {links.map((l) => (
        <Link key={l.href} href={l.href}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>{l.title}</CardTitle>
              <CardDescription>{l.desc}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
