import { NextRequest, NextResponse } from "next/server";

/**
 * Request pre-filter. **Not a security boundary.**
 *
 * Read this before adding a route to the matcher below.
 *
 * All this can see is whether a `session` cookie is *present*. It does not — and
 * on this deployment cannot cheaply — check that the cookie names a live,
 * unexpired session, because that is a database read and this code runs ahead of
 * every matched request. Any value in a `session` cookie gets past it.
 *
 * That is fine, because it is not what stops anyone: every page behind the
 * matcher independently calls `getCurrentUser()` and redirects, and every API
 * route goes through `requireRole`/`requireUser`. This exists only to save a
 * signed-out visitor the round trip of loading `/dashboard` just to be bounced,
 * and to bounce a signed-in one off the guest-only landing page.
 *
 * The variable used to be called `isAuthed`, which is what made this dangerous:
 * it read like an authentication result, so the natural assumption was that
 * anything listed in the matcher was protected. It never was (CLEANUP.md §2.3).
 *
 * **So: a new route added to the matcher gets no protection from this file.**
 * Gate it in the page or the route handler.
 *
 * Renamed from `middleware.ts` — Next 16 deprecated that convention in favour of
 * `proxy.ts`, and warned about it on every build.
 */

/** Pages that are pointless for a signed-out visitor. Each still gates itself. */
const sessionCookieRoutes = ["/settings", "/profile", "/dashboard", "/admin"];

/** Pages a signed-in member should never see — they belong on the dashboard. */
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

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Presence only — see the note above. Deliberately not named `isAuthed`.
  const hasSessionCookie = !!req.cookies.get("session")?.value;

  const isGuestOnly = guestOnlyRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (isGuestOnly) {
    if (hasSessionCookie) return NextResponse.redirect(new URL("/dashboard", req.url));
    return pass(req);
  }

  // The API branch that used to live here was unreachable: `authApiRoutes` was an
  // empty array and `/api` was never in the matcher, so it could not fire even in
  // principle (CLEANUP.md §2.4). API routes authenticate themselves.
  const wantsSession = sessionCookieRoutes.some((r) => pathname.startsWith(r));
  if (wantsSession && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/", req.url));
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
