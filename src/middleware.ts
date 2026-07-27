import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication (logged-in user). The admin console does
// its own ADMIN-role gate server-side in src/app/admin/layout.tsx; here we only
// ensure the visitor is signed in at all.
const authRoutes = ["/settings", "/profile", "/dashboard", "/admin"];

// API routes that require authentication
const authApiRoutes: string[] = [];

// Pages a logged-in user should never see — they belong on the dashboard.
const guestOnlyRoutes = ["/hero"];

/**
 * Server Components can't read the request path, so we stamp it here. The admin
 * layout uses it to keep a committee head inside /admin/committees.
 */
function pass(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("session");
  const isAuthed = !!sessionCookie?.value;

  // Logged-in users get bounced off guest-only pages (e.g. the hero landing).
  const isGuestOnly = guestOnlyRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (isGuestOnly) {
    if (isAuthed) return NextResponse.redirect(new URL("/dashboard", req.url));
    return pass(req);
  }

  // Check if the route requires authentication
  const needsAuth =
    authRoutes.some((r) => pathname.startsWith(r)) ||
    authApiRoutes.some((r) => pathname.startsWith(r));

  if (!needsAuth) return pass(req);

  if (!isAuthed) {
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

  return pass(req);
}

export const config = {
  matcher: [
    "/hero",
    "/settings/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
