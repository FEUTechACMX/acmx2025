//Single source of truth
import { cache } from "react";
import { NextRequest, NextResponse } from "next/server";
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

/** The signed-in account, as every route gate sees it. */
export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * A role test. Deliberately the same shape as the predicates in `types/auth.ts`
 * (`isAdmin`, `isEventAdmin`, `isOfficer`, `isSecretariatOrAbove`) so they can be
 * passed straight in.
 */
export type RoleGuard = (role?: string) => boolean;

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * The one gate for a protected API route.
 *
 * Before this, every route re-picked a convention: `isAdmin(user.role)`,
 * `EVENT_ADMIN_ROLES.includes(...)`, a bare `role !== "ADMIN"`, each with its own
 * status code. Around twenty routes answered an *unauthenticated* caller with
 * 403 and the message "Unauthorized" — the code and the copy disagreeing about
 * which of the two things had gone wrong (CLEANUP.md §5.4, §9.1).
 *
 * The distinction the two codes exist to draw:
 *   401 — no valid session. Signing in would fix it.
 *   403 — signed in, and still not allowed. Signing in again would not.
 *
 * Usage:
 *   const auth = await requireRole(req, isAdmin);
 *   if (!auth.ok) return auth.response;
 *   // auth.user is the account, already role-checked
 */
export async function requireRole(
  req: NextRequest | undefined,
  guard: RoleGuard
): Promise<AuthResult> {
  const user = await getCurrentUser(req);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not signed in." }, { status: 401 }),
    };
  }

  if (!guard(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You don't have access to this." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

/** Any signed-in member, whatever their role. */
export function requireUser(req?: NextRequest): Promise<AuthResult> {
  return requireRole(req, () => true);
}
