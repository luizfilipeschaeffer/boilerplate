import { jsonResponse } from "@/lib/control-plane/auth";

export async function GET() {
  const issuer =
    process.env.CENTRAL_API_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3002";
  return jsonResponse({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    userinfo_endpoint: `${issuer}/api/oauth/userinfo`,
    jwks_uri: `${issuer}/api/oauth/jwks`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
  });
}
