"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SENSITIVE_QUERY_KEYS = new Set([
  "password",
  "passwd",
  "senha",
  "code",
  "token",
  "secret",
]);

/**
 * Remove credenciais da barra de endereço (ex.: submit nativo GET do formulário).
 */
export function StripAuthSearchParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    for (const key of [...params.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        params.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, searchParams, router]);

  return null;
}
