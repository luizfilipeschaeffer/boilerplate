export type AprendizChatMessageDto = {
  id: string;
  role: "aprendiz" | "user";
  content: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export function isAutomationsPanelMessage(
  meta: Record<string, unknown> | null,
): boolean {
  return meta?.kind === "automations_panel";
}
