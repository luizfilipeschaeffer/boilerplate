import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ContaSenhaForm } from "@/components/conta-senha-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { findUserByEmailForAuth } from "@boilerplate/db";

export default async function ContaSenhaPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email.trim().toLowerCase();
  const user = await findUserByEmailForAuth(email);
  if (user?.passwordHash) redirect("/dashboard");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar senha de acesso</CardTitle>
          <CardDescription>
            Este é o primeiro passo do seu painel. Use esta senha com seu e-mail
            para entrar da próxima vez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContaSenhaForm email={email} />
        </CardContent>
      </Card>
    </div>
  );
}
