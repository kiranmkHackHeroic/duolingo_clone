import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("duo_token")?.value;
  const { pathname } = request.nextUrl;

  // Define route rules
  const protectedPaths = ["/learn", "/leaderboard", "/profile", "/lesson"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p)) || pathname === "/";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/learn", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.webp).*)",
  ],
};
