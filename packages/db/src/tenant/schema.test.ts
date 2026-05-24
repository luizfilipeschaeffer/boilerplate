import { describe, expect, test } from "bun:test";
import { assertSafeSchemaName } from "./schema";

describe("assertSafeSchemaName", () => {
  test("aceita schema tenant válido", () => {
    expect(() => assertSafeSchemaName("tenant_acme")).not.toThrow();
    expect(() => assertSafeSchemaName("tenant_a1_b2")).not.toThrow();
  });

  test("rejeita SQL injection clássico", () => {
    const payloads = [
      "'; DROP TABLE users;--",
      'tenant_"; DROP SCHEMA public CASCADE;--',
      "tenant_'; SELECT pg_sleep(10);--",
      "../../../etc/passwd",
      "tenant_",
      "public",
      "TENANT_acme",
    ];
    for (const payload of payloads) {
      expect(() => assertSafeSchemaName(payload)).toThrow();
    }
  });
});
