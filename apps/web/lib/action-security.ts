import { headers } from "next/headers";
import {
  assertSameOriginFromHeaders,
  collectAllowedActionHosts,
} from "@boilerplate/shared/security";

export async function assertSameOriginAction(): Promise<void> {
  const h = await headers();
  assertSameOriginFromHeaders(h, collectAllowedActionHosts());
}

export async function guardedAction<T>(fn: () => Promise<T>): Promise<T> {
  await assertSameOriginAction();
  return fn();
}

export function getClientIpFromHeaders(h: Headers): string | null {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}
