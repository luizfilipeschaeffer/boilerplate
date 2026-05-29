import { listEntradasObraSessionAction } from "@/app/actions/civil-obras-obra-session";
import { getCivilObraObraSession } from "@/app/actions/civil-obras";

export const dynamic = "force-dynamic";

export default async function ObraPortalDiarioPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await getCivilObraObraSession();
  if (!session) return null;

  const entradas = await listEntradasObraSessionAction(obraId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Diário</h1>
      {session.perfil === "colaborador" ? (
        <p className="text-muted-foreground text-xs">
          Publicação de novas entradas disponível nesta sessão isolada (em evolução).
        </p>
      ) : null}
      <ul className="divide-y rounded-md border">
        {entradas.map((e) => (
          <li key={e.id} className="p-3 text-sm">
            <p className="font-medium">{e.titulo}</p>
            <p className="text-muted-foreground text-xs">{e.dataRegistro}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
