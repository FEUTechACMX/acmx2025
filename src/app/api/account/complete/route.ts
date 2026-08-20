import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  findAccountTokenByRaw,
  isTokenRedeemable,
} from "@/lib/account-tokens";
import {
  accountCompleteByAddress,
  clientAddress,
} from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/complete — body `{ token, newPassword }`.
 * No auto-login: mark claimed, wipe sessions, bounce client to /login.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const rawToken = typeof record.token === "string" ? record.token : "";
  const newPassword = typeof record.newPassword === "string" ? record.newPassword : "";
  const confirmPassword =
    record.confirmPassword === undefined
      ? undefined
      : typeof record.confirmPassword === "string"
        ? record.confirmPassword
        : "";

  const addressKey = `account-complete:${clientAddress(req)}`;
  const byAddress = accountCompleteByAddress.check(addressKey);
  if (!byAddress.allowed) {
    accountCompleteByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "Too many attempts. Wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(byAddress.retryAfter) } }
    );
  }

  const token = await findAccountTokenByRaw(rawToken);
  if (!token || !isTokenRedeemable(token)) {
    accountCompleteByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "This link has expired or was already used. Request a new one." },
      { status: 400 }
    );
  }

  const strength = validatePasswordStrength(newPassword, {
    studentId: token.user.studentId,
    contactNumber: token.user.contactNumber,
    schoolEmail: token.user.schoolEmail,
    personalEmail: token.user.personalEmail,
  }, "New password");
  if (strength) {
    return NextResponse.json({ errors: { newPassword: strength } }, { status: 400 });
  }
  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    return NextResponse.json(
      { errors: { confirmPassword: "The two passwords don't match." } },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: token.userId },
      data: { password: hashed, mustChangePassword: false },
    });
    await tx.accountToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    });
    // No auto-login — delete every session for this user.
    await tx.session.deleteMany({ where: { userId: token.userId } });
  });

  accountCompleteByAddress.reset(addressKey);

  return NextResponse.json({
    ok: true,
    message: "Password saved. Sign in with your student number and new password.",
  });
}
