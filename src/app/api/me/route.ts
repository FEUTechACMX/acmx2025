import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { safeUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json({}); // no user logged in
    }

    const safeUser: safeUser = {
      studentId: dbUser.studentId,
      name: [
        dbUser.firstName,
        dbUser.middleName,
        dbUser.lastName,
        dbUser.suffix,
      ]
        .filter(Boolean)
        .join(" "),
      email: dbUser.schoolEmail,
      role: dbUser.role,
      points: dbUser.points,
    };

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("Error in /api/me:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
