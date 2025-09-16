import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.cookies.get("auth-token");
  const isLoginPath =
    pathname === "/auth/v1/login" || pathname === "/auth/v2/login";

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/v1/login", req.url));
  }
  if (isLoggedIn && isLoginPath) {
    return NextResponse.redirect(new URL("/dashboard/default", req.url));
  }

  // DASHBOARD yanıtlarını cache'letme
  const res = NextResponse.next();
  if (pathname.startsWith("/dashboard")) {
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    res.headers.set("Surrogate-Control", "no-store");
  }
  return res;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/auth/v1/:path*", "/auth/v2/:path*"],
};
