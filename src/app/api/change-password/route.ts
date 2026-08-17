import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePasswordChange, hasErrors } from "@/lib/validation";
import { passwordChangeByUser } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The brake now lives in `lib/rate-limit.ts`, shared with `/api/login` — which
 * had none at all until §2.7. Its honest limits are documented there.
 */
const tooManyAttempts = (userId: string) =>
  !passwordChangeByUser.check(userId).allowed;
const recordFailure = (userId: string) => passwordChangeByUser.fail(userId);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "You're not signed in." },
        { status: 401 }
      );
    }

    if (tooManyAttempts(user.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed attempts. Wait 15 minutes and try again.",
        },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Malformed request." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = (body ?? {}) as Record<
      string,
      unknown
    >;

    // Same rules the form just ran — re-run here because the form is skippable.
    const errors = validatePasswordChange({ currentPassword, newPassword, confirmPassword });
    if (hasErrors(errors)) {
      return NextResponse.json(
        {
          success: false,
          message: errors.newPassword ?? errors.confirmPassword ?? errors.currentPassword,
          errors,
        },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(currentPassword as string, user.password);
    if (!valid) {
      recordFailure(user.id);
      return NextResponse.json(
        {
          success: false,
          message: "That current password is incorrect. Try again.",
          errors: { currentPassword: "That current password is incorrect." },
        },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword as string, 12);

    const cookieStore = await cookies();
    const currentSessionId = cookieStore.get("session")?.value;

    // Rotating the password ends every other session. A password change is
    // often a response to a suspected compromise, so leaving the other logins
    // alive would defeat the point. The current device stays signed in — that
    // is the one the user is demonstrably holding.
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.session.deleteMany({
        where: {
          userId: user.id,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
      }),
    ]);

    passwordChangeByUser.reset(user.id);

    return NextResponse.json({
      success: true,
      message: "Password updated. Your other devices have been signed out.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}
