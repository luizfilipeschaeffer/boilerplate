import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({
  className,
}: Pick<React.ComponentProps<typeof Loader2>, "className">) {
  return (
    <Loader2
      role="status"
      aria-label="Carregando"
      className={cn("size-4 animate-spin", className)}
    />
  );
}

export { Spinner };
