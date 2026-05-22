export type CommsChannel =
  | "email"
  | "whatsapp"
  | "telegram"
  | "sms"
  | "internal";
export type CommsDirection = "inbound" | "outbound";
export type CommsParticipantKind = "client" | "internal";

export const COMMS_CHANNEL_LABELS: Record<CommsChannel, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  sms: "SMS",
  internal: "Chat interno",
};

export const COMMS_PARTICIPANT_LABELS: Record<CommsParticipantKind, string> = {
  client: "Cliente",
  internal: "Equipe",
};
