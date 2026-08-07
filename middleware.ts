import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const session = await getIronSession<SessionData>(request, response, {
    cookieName: "hassan_admin_session",
    password,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });

  const loggedIn = Boolean(session.isLoggedIn && session.adminId && !session.pending2FA);

  if (!loggedIn && !isPublicAdminPath) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (loggedIn && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
