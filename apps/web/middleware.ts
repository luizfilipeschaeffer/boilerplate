import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/esqueci-senha");
  const isPublic =
    isAuthPage ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/trpc");

  if (!session?.user && !isPublic) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }

  const needsSetup =
    Boolean(session?.needsOnboarding) || !session?.organizationId;

  if (session?.user && needsSetup && !pathname.startsWith("/onboarding") && !isPublic) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (session?.user && !needsSetup && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (session?.user && pathname === "/login") {
    return NextResponse.redirect(
      new URL(needsSetup ? "/onboarding" : "/dashboard", req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
