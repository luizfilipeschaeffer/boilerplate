import { auth } from "@/auth";
import { PlatformShell } from "@/components/platform-shell";
import { getPlatformNavForRole } from "@/lib/modules/platform-nav";
import { redirect } from "next/navigation";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.platformRole) redirect("/login");

  const navItems = getPlatformNavForRole(session.user.platformRole);
  const user = {
    name: session.user.name ?? "Operador",
    email: session.user.email ?? "",
    platformRole: session.user.platformRole,
  };

  return (
    <PlatformShell navItems={navItems} user={user}>
      {children}
    </PlatformShell>
  );
}
