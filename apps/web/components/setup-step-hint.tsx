import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function SetupStepHint({ title, children, className }: Props) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm",
        className,
      )}
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        strokeWidth={2}
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <div className="min-w-0 space-y-2">
        <p className="font-medium text-foreground">{title}</p>
        <div className="text-muted-foreground space-y-1.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4">
          {children}
        </div>
      </div>
    </div>
  );
}
