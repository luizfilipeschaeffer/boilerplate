import { auth } from "@/auth";
import { defaultEstoquePath, canViewEstoque } from "@/lib/estoque-access";
import { redirect } from "next/navigation";

export default async function EstoquePage() {
  const session = await auth();
  const role = session?.role ?? "dono";

  if (!canViewEstoque(role)) {
    redirect("/dashboard");
  }

  redirect(defaultEstoquePath(role));
}
