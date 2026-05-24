import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { getIntegratorKek, IntegratorKekError } from "./kek";

export type EnvelopeBlob = {
  v: 1;
  wrappedDek: string;
  ciphertext: string;
  iv: string;
  tag: string;
};

export class EnvelopeDecryptError extends Error {
  constructor(message = "Falha ao descriptografar credenciais.") {
    super(message);
    this.name = "EnvelopeDecryptError";
  }
}

function generateDek(): Buffer {
  return randomBytes(32);
}

function wrapDek(dek: Buffer, kek: Buffer): { wrapped: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kek, iv);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    wrapped: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function unwrapDek(
  wrappedB64: string,
  ivB64: string,
  tagB64: string,
  kek: Buffer,
): Buffer {
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const wrapped = Buffer.from(wrappedB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", kek, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(wrapped), decipher.final()]);
}

function encryptWithDek(
  payload: Record<string, string>,
  dek: Buffer,
): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dek, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptWithDek(
  ciphertextB64: string,
  ivB64: string,
  tagB64: string,
  dek: Buffer,
): Record<string, string> {
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", dek, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  const parsed = JSON.parse(decrypted.toString("utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new EnvelopeDecryptError();
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

export function encryptEnvelope(
  secrets: Record<string, string>,
  kek?: Buffer,
): string {
  const key = kek ?? getIntegratorKek();
  const dek = generateDek();
  const wrapped = wrapDek(dek, key);
  const encrypted = encryptWithDek(secrets, dek);
  const blob: EnvelopeBlob = {
    v: 1,
    wrappedDek: wrapped.wrapped,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
  };
  return JSON.stringify({
    ...blob,
    dekIv: wrapped.iv,
    dekTag: wrapped.tag,
  });
}

export function decryptEnvelope(serialized: string, kek?: Buffer): Record<string, string> {
  try {
    const key = kek ?? getIntegratorKek();
    const parsed = JSON.parse(serialized) as EnvelopeBlob & {
      dekIv?: string;
      dekTag?: string;
    };
    if (parsed.v !== 1 || !parsed.wrappedDek || !parsed.ciphertext) {
      throw new EnvelopeDecryptError();
    }
    const dekIv = parsed.dekIv;
    const dekTag = parsed.dekTag;
    if (!dekIv || !dekTag) {
      throw new EnvelopeDecryptError();
    }
    const dek = unwrapDek(parsed.wrappedDek, dekIv, dekTag, key);
    return decryptWithDek(parsed.ciphertext, parsed.iv, parsed.tag, dek);
  } catch (error) {
    if (error instanceof IntegratorKekError || error instanceof EnvelopeDecryptError) {
      throw error;
    }
    throw new EnvelopeDecryptError();
  }
}

export function parseEnvelopeBlob(serialized: string): EnvelopeBlob | null {
  try {
    const parsed = JSON.parse(serialized) as EnvelopeBlob;
    if (parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}
