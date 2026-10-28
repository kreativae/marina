import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSession,
} from "@/lib/admin-auth";

function isPublicApiRequest(pathname: string, method: string) {
  if (pathname === "/api/auth/login" || pathname === "/api/auth/logout") {
    return true;
  }
  if (pathname === "/api/health" && method === "GET") return true;
  if (pathname === "/api/leads" && method === "POST") return true;
  if (pathname === "/api/bookings" && method === "POST") return true;
  if (pathname === "/api/availability" && method === "GET") return true;
  if (pathname === "/api/event-types" && method === "GET") return true;
  if (pathname === "/api/webhooks/hotmart" && method === "POST") return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname === "/api/auth/login" || pathname === "/api/auth/logout") {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");
  if (isApi && isPublicApiRequest(pathname, request.method)) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  if (
    isValidAdminSession(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    )
  ) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json(
      {
        error: process.env.ADMIN_PASSWORD
          ? "Autenticação de administrador necessária."
          : "Configure ADMIN_PASSWORD e ADMIN_SESSION_SECRET.",
      },
      { status: process.env.ADMIN_PASSWORD ? 401 : 503 }
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
