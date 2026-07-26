import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Revokes sessions belonging to the caller.
 *
 * Body: `{ id }` to end one session, or `{ all: true }` to end every session
 * except the one making the request. The current session is always spared —
 * signing yourself out mid-request would leave the UI in a state it can't
 * recover from, and "Log out" already exists for that.
 *
 * The delete is filtered by `userId` as well as `id`, so passing someone
 * else's session id deletes nothing rather than logging them out.
 */
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const { id, all } = (body ?? {}) as { id?: unknown; all?: unknown };

    const cookieStore = await cookies();
    const currentSessionId = cookieStore.get("session")?.value;

    if (all === true) {
      const { count } = await prisma.session.deleteMany({
        where: {
          userId: user.studentId,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
      });
      return NextResponse.json({
        ok: true,
        revoked: count,
        message:
          count === 0
            ? "No other sessions were active."
            : `Signed out of ${count} other ${count === 1 ? "session" : "sessions"}.`,
      });
    }

    if (typeof id !== "string" || !id) {
      return NextResponse.json(
        { error: "Provide a session id, or { all: true }." },
        { status: 400 }
      );
    }

    if (id === currentSessionId) {
      return NextResponse.json(
        { error: "That's this device. Use Log Out to end this session." },
        { status: 400 }
      );
    }

    const { count } = await prisma.session.deleteMany({
      where: { id, userId: user.studentId },
    });

    if (count === 0) {
      return NextResponse.json({ error: "That session no longer exists." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, revoked: count, message: "Session revoked." });
  } catch (err) {
    console.error("Error revoking session:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
