// app/api/login/route.ts
import { NextResponse } from "next/server";
import { login, createSession } from "@/lib/identity";
import { toSafeUser } from "@/lib/userMapper";
import {
  clientAddress,
  loginByAccount,
  loginByAddress,
} from "@/lib/rate-limit";
import { str } from "@/lib/validation";

/**
 * One message for every failure, on purpose.
 *
 * `login()` throws "Invalid Credentials" when no account matches and "Invalid
 * Password" when one does — and this route used to return `err.message`
 * verbatim, so the two were distinguishable from outside. That is an account
 * enumerator: student numbers at FEU Tech are sequential, so anyone could walk
 * the range and learn which ones are real before guessing a single password.
 */
const REFUSED = "Student number or password is incorrect.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Malformed request." },
      { status: 400 }
    );
  }

  const studentId = str((body as Record<string, unknown>).studentId);
  const password = typeof (body as Record<string, unknown>).password === "string"
    ? ((body as Record<string, unknown>).password as string)
    : "";

  if (!studentId || !password) {
    return NextResponse.json({ success: false, message: REFUSED }, { status: 401 });
  }

  // Two buckets — tight per account, loose per address. See lib/rate-limit.
  const accountKey = `account:${studentId}`;
  const addressKey = `address:${clientAddress(req)}`;

  const byAccount = loginByAccount.check(accountKey);
  const byAddress = loginByAddress.check(addressKey);
  const blocked = !byAccount.allowed ? byAccount : !byAddress.allowed ? byAddress : null;

  if (blocked) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many attempts. Wait a few minutes and try again.",
      },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } }
    );
  }

  try {
    const user = await login(studentId, password);
    const sessionId = await createSession(user.id);

    // A successful sign-in clears the account's history, so somebody who
    // mistyped twice and then got it right isn't carrying those two around.
    loginByAccount.reset(accountKey);

    // Projected through toSafeUser: `login()` returns the whole row minus the
    // password, which meant this unauthenticated endpoint handed back
    // personalEmail, contactNumber, facebookLink, discordName and
    // supabaseUserId — none of which /api/me will give you (CLEANUP.md §2.5).
    const res = NextResponse.json({ success: true, user: toSafeUser(user) });
    res.cookies.set({
      name: "session",
      value: sessionId,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    // Both buckets count the failure: the account bucket stops one password
    // being guessed, the address bucket stops many accounts being sprayed.
    loginByAccount.fail(accountKey);
    loginByAddress.fail(addressKey);

    // Logged, never returned — see REFUSED above.
    console.error("Login failed:", err instanceof Error ? err.message : err);

    return NextResponse.json({ success: false, message: REFUSED }, { status: 401 });
  }
}
