import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAccountTokenEmail } from "@/lib/email";
import {
  ACCOUNT_REQUEST_FULL,
  ACCOUNT_REQUEST_OK,
  dailyCapReached,
  issueAccountToken,
} from "@/lib/account-tokens";
import {
  accountRequestByAddress,
  accountRequestByStudent,
  clientAddress,
} from "@/lib/rate-limit";
import {
  check,
  hasErrors,
  studentNumber,
  STUDENT_NUMBER_INVALID,
  str,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/request — body `{ studentId }`.
 * Format-invalid → 400 "Enter a valid student number." (no DB).
 * Otherwise always the same generic 200 when under the daily cap.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const studentId = str((body as Record<string, unknown>).studentId);
  const formatErrors = check({ studentId }, { studentId: [studentNumber()] });
  if (hasErrors(formatErrors)) {
    return NextResponse.json({ error: STUDENT_NUMBER_INVALID }, { status: 400 });
  }

  const studentKey = `account-req:${studentId}`;
  const addressKey = `account-req:${clientAddress(req)}`;
  const byStudent = accountRequestByStudent.check(studentKey);
  const byAddress = accountRequestByAddress.check(addressKey);
  const blocked = !byStudent.allowed ? byStudent : !byAddress.allowed ? byAddress : null;
  if (blocked) {
    accountRequestByStudent.fail(studentKey);
    accountRequestByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "Too many requests. Wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } }
    );
  }

  if (await dailyCapReached()) {
    return NextResponse.json({ ok: true, message: ACCOUNT_REQUEST_FULL });
  }

  const user = await prisma.user.findUnique({
    where: { studentId },
    select: {
      id: true,
      schoolEmail: true,
      mustChangePassword: true,
    },
  });

  // Existence-hiding: no user → same OK, no email.
  if (!user) {
    return NextResponse.json({ ok: true, message: ACCOUNT_REQUEST_OK });
  }

  const kind = user.mustChangePassword ? "CLAIM" : "RESET";

  try {
    const { raw } = await issueAccountToken(user.id, kind);
    await sendAccountTokenEmail({
      kind,
      toSchoolEmail: user.schoolEmail,
      rawToken: raw,
    });
  } catch (err) {
    console.error("Account request email failed:", err instanceof Error ? err.message : err);
    // Still generic — do not leak mail infra state to the client.
  }

  return NextResponse.json({ ok: true, message: ACCOUNT_REQUEST_OK });
}
