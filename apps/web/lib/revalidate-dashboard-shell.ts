import { revalidatePath } from "next/cache";

/** Recarrega layout do dashboard (sidebar, módulos ativos, paleta). */
export function revalidateDashboardShell() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/configuracoes");
}
