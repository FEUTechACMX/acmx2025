import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isSecretariatOrAbove } from "@/types/auth";
import { sendAccountTokenEmail } from "@/lib/email";
import { issueAccountToken } from "@/lib/account-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[studentNumber]/account-reset
 * Officer re-issues CLAIM (if mustChangePassword) or RESET. Bypasses the
 * public 300/day cap — stuck-member recovery (SPEC-D5 §4.5 / §12.2).
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ studentNumber: string }> }
) {
  const auth = await requireRole(req, isSecretariatOrAbove);
  if (!auth.ok) return auth.response;

  const { studentNumber } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { studentId: studentNumber },
    select: { id: true, schoolEmail: true, mustChangePassword: true },
  });
  if (!user) {
    return NextResponse.json({ error: "No member with that student number." }, { status: 404 });
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
    console.error("Admin account reset email failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not send the email. Check mail config and try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    kind,
    message: `A ${kind === "CLAIM" ? "claim" : "reset"} link was emailed to the school address on file.`,
  });
}
