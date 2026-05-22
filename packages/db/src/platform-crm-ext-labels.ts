const ACTIVITY_LABELS: Record<string, string> = {
  note: "Nota",
  call: "Ligação",
  meeting: "Reunião",
  message: "Mensagem",
};

export function activityTypeLabel(type: string): string {
  return ACTIVITY_LABELS[type] ?? type;
}
