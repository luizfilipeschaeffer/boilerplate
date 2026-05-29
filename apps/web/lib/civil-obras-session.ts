import "server-only";

import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "civil-obras-session";
const SCOPE = "civil-obras";

export type CivilObrasSession = {
  scope: typeof SCOPE;
  usuarioId: string;
  obraId: string;
  tenantId: string;
  schemaName: string;
  perfil: "colaborador" | "visualizador";
  sessionVersion: number;
};

function secretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-civil-obras-secret";
  return new TextEncoder().encode(secret);
}

export async function signCivilObrasSession(
  payload: CivilObrasSession,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyCivilObrasSession(
  token: string,
): Promise<CivilObrasSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.scope !== SCOPE) return null;
    return payload as unknown as CivilObrasSession;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
