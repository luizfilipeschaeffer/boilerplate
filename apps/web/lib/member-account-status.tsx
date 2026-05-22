import {
  MEMBER_ACCOUNT_STATUS_LABELS,
  type MemberAccountStatus,
} from "@boilerplate/db";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function memberAccountStatusBadgeVariant(
  status: MemberAccountStatus,
): "secondary" | "outline" | "default" {
  if (status === "ativa") return "secondary";
  if (status === "convidado") return "default";
  return "outline";
}

export function MemberAccountStatusBadge({
  status,
  className,
}: {
  status: MemberAccountStatus;
  className?: string;
}) {
  return (
    <Badge
      variant={memberAccountStatusBadgeVariant(status)}
      className={cn(className)}
    >
      {MEMBER_ACCOUNT_STATUS_LABELS[status]}
    </Badge>
  );
}

export { MEMBER_ACCOUNT_STATUS_LABELS, type MemberAccountStatus };
