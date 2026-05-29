import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { canAccessRoute } from "@/lib/rbac";
import { NextResponse, type NextRequest } from "next/server";
import { resolveDeploymentMode } from "@boilerplate/platform-api";

const SETUP_COOKIE = "bp_setup_complete";

/** Edge: sem Prisma. Setup (onboarding vs painel) é resolvido no servidor via `resolveUserSetup`. */
const { auth } = NextAuth(authConfig);

function getRequestHost(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-host");
  const host = forwarded ?? req.headers.get("host") ?? "";
  return host.split(",")[0]?.trim().toLowerCase() ?? "";
}

function getAllowedHostsFromEnvAndCookie(req: NextRequest): string[] {
  const fromEnv = (process.env.ALLOWED_HOSTS ?? process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const fromCookie = req.cookies.get("bp_allowed_hosts")?.value ?? "";
  const fromCookieList = fromCookie
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...fromCookieList])];
}

function isHostAllowedEdge(host: string, req: NextRequest): boolean {
  const allowed = getAllowedHostsFromEnvAndCookie(req);
  if (allowed.length === 0) return true;
  if (!host) return false;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return true;
  return allowed.some((a) => {
    if (a.startsWith("*.")) {
      const suffix = a.slice(2);
      return host === suffix || host.endsWith(`.${suffix}`);
    }
    return host === a;
  });
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isSelfHosted = resolveDeploymentMode() === "self_hosted";

  const isSetupRoute =
    pathname.startsWith("/setup") || pathname.startsWith("/api/setup");
  const setupCompleteCookie = req.cookies.get(SETUP_COOKIE)?.value === "1";
  const setupCompleteEnv = process.env.SETUP_COMPLETE === "true";

  if (isSelfHosted && !isSetupRoute && !setupCompleteCookie && !setupCompleteEnv) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  if (isSelfHosted && !isSetupRoute) {
    const host = getRequestHost(req);
    if (!isHostAllowedEdge(host, req)) {
      return new NextResponse("Acesso negado: domínio de origem não autorizado.", {
        status: 403,
      });
    }
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host.toLowerCase();
        if (!isHostAllowedEdge(originHost, req)) {
          return new NextResponse("Origin não autorizado.", { status: 403 });
        }
      } catch {
        return new NextResponse("Origin inválido.", { status: 403 });
      }
    }
  }

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/esqueci-senha") ||
    pathname.startsWith("/convite-vendedor") ||
    isSetupRoute;
  const isWebhook = pathname.startsWith("/api/webhooks");
  const isPublic =
    isAuthPage ||
    isWebhook ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/trpc");

  if (!session?.user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    session?.user &&
    (pathname === "/login" || pathname.startsWith("/cadastro"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const needsOnboarding = Boolean(
    (session as { needsOnboarding?: boolean } | null)?.needsOnboarding,
  );
  const role = (session as { role?: string } | null)?.role;

  if (session?.user && !isPublic && !needsOnboarding && !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user && !isPublic && !needsOnboarding && role && pathname.startsWith("/")) {
    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
