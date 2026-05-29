import { getCivilObraObraSession } from "@/app/actions/civil-obras";
import { redirect } from "next/navigation";

export default async function ObraPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await getCivilObraObraSession();
  if (!session || session.obraId !== obraId) {
    redirect("/login");
  }
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b px-4 py-3">
        <p className="text-sm font-medium">Gestão de Obras — {session.perfil}</p>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
