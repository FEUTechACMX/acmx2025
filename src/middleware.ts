import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication (logged-in user)
const authRoutes = ["/settings", "/scanner"];

// API routes that require authentication
const authApiRoutes = ["/api/scan"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the route requires authentication
  const needsAuth =
    authRoutes.some((r) => pathname.startsWith(r)) ||
    authApiRoutes.some((r) => pathname.startsWith(r));

  if (!needsAuth) return NextResponse.next();

  // Check for session cookie
  const sessionCookie = req.cookies.get("session");

  if (!sessionCookie?.value) {
    // Pages → redirect to home
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // API routes → return 401
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*", "/scanner/:path*", "/api/scan/:path*"],
};
