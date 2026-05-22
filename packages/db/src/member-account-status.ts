export type MemberAccountStatus = "ativa" | "inativa" | "convidado";

export const MEMBER_ACCOUNT_STATUS_LABELS: Record<
  MemberAccountStatus,
  string
> = {
  ativa: "Ativa",
  inativa: "Inativa",
  convidado: "Convidado",
};

export function resolveMemberAccountStatus(input: {
  membershipActive: boolean;
  hasPassword: boolean;
}): MemberAccountStatus {
  if (!input.membershipActive) return "inativa";
  if (!input.hasPassword) return "convidado";
  return "ativa";
}
