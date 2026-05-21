import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.platformRole) redirect("/dashboard");
  redirect("/login");
}
