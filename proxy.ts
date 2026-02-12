import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Protect specific paths
  if (
    url.pathname.startsWith("/scanner") ||
    url.pathname.startsWith("/admin")
  ) {
    // getCurrentUser may need to accept the request cookies
    const user = await getCurrentUser(req);

    if (!user || user.role !== "ADMIN") {
      // redirect to home if not admin
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // All other routes allowed
  return NextResponse.next();
}

// Tell Next.js which routes to run middleware on
export const config = {
  matcher: ["/scanner/:path*", "/admin/:path*"],
};
