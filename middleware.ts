import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { AUTH_COOKIE_NAME, sanitizeNextPath, type AuthSessionData } from "@/lib/auth-shared";

function rewriteIntegratedApp(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/kidmind-ai" || pathname === "/kidmind-ai/") {
    return NextResponse.rewrite(new URL("/kidmind-ai/index.html", request.url));
  }

  if (pathname === "/flash-cards" || pathname === "/flash-cards/") {
    return NextResponse.rewrite(new URL("/flash-cards/index.html", request.url));
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const integrated = rewriteIntegratedApp(request);
  if (integrated) return integrated;

  const { pathname } = request.nextUrl;

  // Block direct access to static KidMind admin HTML — use portfolio /admin instead.
  if (pathname === "/kidmind-ai/admin.html" || pathname === "/kidmind-ai/admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isPublicAdminPath =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  const response = NextResponse.next();
  const password = process.env.SESSION_SECRET;

  if (!password || password.length < 32) {
    if (!isPublicAdminPath) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const session = await getIronSession<AuthSessionData>(request, response, {
    cookieName: AUTH_COOKIE_NAME,
    password,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });

  // Middleware can only check session shape quickly; requireAdmin() re-checks DB role on pages/APIs.
  const loggedIn = Boolean(session.isLoggedIn && session.userId && !session.pending2FA);

  if (!loggedIn && !isPublicAdminPath) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", sanitizeNextPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  if (loggedIn && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/kidmind-ai",
    "/kidmind-ai/",
    "/kidmind-ai/admin",
    "/kidmind-ai/admin.html",
    "/flash-cards",
    "/flash-cards/",
  ],
};
