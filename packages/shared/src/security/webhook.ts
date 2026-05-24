import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret?.trim()) {
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader?.trim()) return false;

  const expected = createHmac("sha256", secret.trim())
    .update(rawBody)
    .digest("hex");

  const provided = signatureHeader.replace(/^sha256=/, "").trim();
  if (expected.length !== provided.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
