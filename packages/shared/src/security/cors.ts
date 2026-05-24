export function collectAllowedCorsOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL,
    process.env.AUTH_URL,
  ]
    .flatMap((v) => (v ? v.split(",") : []))
    .map((v) => v.trim())
    .filter(Boolean);
}

export function corsHeadersForRequest(
  origin: string | null,
  allowedOrigins: string[],
): Record<string, string> {
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function handleCorsPreflight(
  origin: string | null,
  allowedOrigins: string[],
): Response | null {
  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeadersForRequest(origin, allowedOrigins),
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
