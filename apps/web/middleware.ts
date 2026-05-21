import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/onboarding");
  const isPublic =
    isAuthPage ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/trpc");

  if (!session?.user && !isPublic) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }

  if (session?.needsOnboarding && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (
    session?.user &&
    !session.needsOnboarding &&
    pathname.startsWith("/onboarding")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (session?.user && pathname === "/login") {
    return NextResponse.redirect(
      new URL(session.needsOnboarding ? "/onboarding" : "/dashboard", req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
