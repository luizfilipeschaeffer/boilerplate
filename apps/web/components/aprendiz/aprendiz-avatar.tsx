import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";

export function AprendizAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "sm" ? "size-7" : size === "lg" ? "size-11" : "size-9";
  const icon =
    size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/25",
        dim,
        className,
      )}
      aria-hidden
    >
      <Bot className={cn(icon, "text-primary")} />
    </div>
  );
}
