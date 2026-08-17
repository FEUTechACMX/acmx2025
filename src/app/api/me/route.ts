import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/me — the current member, or an explicit absence.
 *
 * Deliberately not gated: "nobody is signed in" is a normal answer here, not a
 * refusal, which is why this returns 200 where every other session-dependent
 * route would 401 (see `requireUser`).
 *
 * It used to return a bare `{}` for a signed-out caller **and** a bare `{}` with
 * a 500 when something failed — two different situations, one indistinguishable
 * body, so a client could not tell "you are not signed in" from "the server
 * broke" from the payload at all (CLEANUP.md §9.2). `user: null` now states the
 * absence, and a failure says so in the envelope as well as the status.
 */
export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    return NextResponse.json({
      ok: true,
      user: dbUser ? toSafeUser(dbUser) : null,
    });
  } catch (err) {
    console.error("Error in /api/me:", err);
    return NextResponse.json(
      { ok: false, error: "Couldn't read your session." },
      { status: 500 }
    );
  }
}
