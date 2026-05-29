import Link from "next/link";
import { ConfigEmpresaCard } from "@/components/config-empresa-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  {
    href: "/configuracoes/membros",
    title: "Membros",
    desc: "Equipe, setores de acesso, módulos e permissões.",
  },
  {
    href: "/configuracoes/setores",
    title: "Setores",
    desc: "Departamentos e módulos disponíveis em cada setor.",
  },
  {
    href: "/configuracoes/filiais",
    title: "Filiais",
    desc: "Multi-loja e filial ativa na sidebar.",
  },
  {
    href: "/configuracoes/integradores",
    title: "Integradores",
    desc: "Credenciais próprias (BYOK) ou padrão da plataforma.",
  },
  {
    href: "/configuracoes/pagamentos",
    title: "Pagamentos",
    desc: "Formas aceitas nos pedidos e vendas.",
  },
  {
    href: "/configuracoes/cobranca",
    title: "Cobrança",
    desc: "Validação de pagamento e período de teste da conta.",
  },
  {
    href: "/configuracoes/conta",
    title: "Conta da plataforma",
    desc: "Assinatura, plano e faturamento central.",
  },
  {
    href: "/configuracoes/licenca",
    title: "Licença",
    desc: "Entitlements, limites e status da licença.",
  },
  {
    href: "/configuracoes/modulos",
    title: "Módulos extras",
    desc: "Catálogo e instalação de módulos autorizados.",
  },
  {
    href: "/configuracoes/suporte",
    title: "Suporte",
    desc: "Tickets e atendimento vinculado à instalação.",
  },
  {
    href: "/configuracoes/atualizacoes",
    title: "Atualizações",
    desc: "Versões disponíveis da plataforma.",
  },
  {
    href: "/configuracoes/dominios",
    title: "Domínios permitidos",
    desc: "Controle de origem de acesso à instalação.",
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6 xl:grid-cols-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{l.title}</CardTitle>
                <CardDescription>{l.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <ConfigEmpresaCard />
    </div>
  );
}
