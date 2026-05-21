import Link from "next/link";

export default function PlatformAdminHome() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-8">
      <div>
        <p className="text-sm font-medium text-amber-400">platform-admin</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Painel da Plataforma
        </h1>
        <p className="mt-2 text-zinc-400">
          Área interna para CRM de clientes SaaS, comunicação omnichannel e
          analytics de demanda de módulos (PRD §17).
        </p>
      </div>
      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
        <li>CRM e pipeline — planejado</li>
        <li>Comms omnichannel — planejado</li>
        <li>Insights / modulo_demanda — planejado</li>
      </ul>
      <Link
        href="/dashboard"
        className="inline-flex w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
      >
        Entrar no dashboard MVP
      </Link>
    </main>
  );
}
