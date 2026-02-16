import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { STORAGE_KEYS } from "@/lib/utils/constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(STORAGE_KEYS.TOKEN)?.value;
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedPaths = ["/profile", "/orders", "/wishlist"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Auth routes that should redirect if already logged in
  const authPaths = ["/login", "/signup"];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Redirect to login if trying to access protected route without token
  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if trying to access auth routes while logged in
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/login",
    "/signup",
  ],
};
