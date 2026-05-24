import { describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import {
  decryptEnvelope,
  encryptEnvelope,
  EnvelopeDecryptError,
} from "./envelope";
import { maskSecret } from "./mask";

describe("envelope encryption", () => {
  const kek = randomBytes(32);

  test("round-trip preserva payload", () => {
    const secrets = { apiKey: "sk_live_secret_value_123", webhook: "whsec_abc" };
    const blob = encryptEnvelope(secrets, kek);
    expect(decryptEnvelope(blob, kek)).toEqual(secrets);
  });

  test("dois registros geram wrappedDek diferentes", () => {
    const secrets = { apiKey: "same_value" };
    const a = JSON.parse(encryptEnvelope(secrets, kek)) as { wrappedDek: string };
    const b = JSON.parse(encryptEnvelope(secrets, kek)) as { wrappedDek: string };
    expect(a.wrappedDek).not.toBe(b.wrappedDek);
  });

  test("decrypt sem KEK correta falha sem expor secret", () => {
    const secret = "super_secret_api_key_value";
    const blob = encryptEnvelope({ apiKey: secret }, kek);
    const wrongKek = randomBytes(32);
    expect(() => decryptEnvelope(blob, wrongKek)).toThrow(EnvelopeDecryptError);
    try {
      decryptEnvelope(blob, wrongKek);
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      expect(String(error)).not.toContain("apiKey");
    }
  });

  test("maskSecret mantém últimos 4 caracteres", () => {
    expect(maskSecret("sk_live_abcdefgh")).toMatch(/efgh$/);
    expect(maskSecret("sk_live_abcdefgh")).toContain("•");
    expect(maskSecret("sk_live_abcdefgh")).not.toContain("sk_live");
  });
});
