"use client";

import { getCsrfToken } from "next-auth/react";

export async function updateSessionContext(data: {
  branchId?: string;
  sectorId?: string;
}) {
  const csrfToken = await getCsrfToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csrfToken, data }),
  });
  if (!res.ok) {
    throw new Error("Não foi possível atualizar o contexto da sessão.");
  }
}
