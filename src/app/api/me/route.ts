import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth"; // your auth.ts logic
import type { User } from "../../../../types/auth";

export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json({}); // no user logged in
    }

    const safeUser: User = {
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
    };

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("Error in /api/me:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
