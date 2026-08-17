//Single source of truth
import { cache } from "react";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export const dynamic = "force-dynamic";

/**
 * The session read, memoised for the lifetime of one request.
 *
 * `getCurrentUser()` is called from the root layout (to render the nav), again
 * from the page, and again inside every API handler that page calls — so a
 * single profile load was issuing the same session query three or more times.
 * Keying on the session id rather than the request object is what makes the
 * memoisation actually hit: every call site derives the same string, so they
 * all share one lookup.
 */
const loadSession = cache(async (sessionId: string) =>
  prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })
);

export async function getCurrentUser(req?: NextRequest) {
  let sessionId: string | undefined;

  if (req) {
    // middleware /API route
    const cookie = req.cookies.get("session");
    sessionId = cookie?.value;
  } else {
    const cookieStore = await import("next/headers").then((m) => m.cookies());
    sessionId = cookieStore.get("session")?.value;
  }

  if (!sessionId) return null;

  const session = await loadSession(sessionId);

  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}
