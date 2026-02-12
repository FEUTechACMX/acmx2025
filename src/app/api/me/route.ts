import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json({}); // no user logged in
    }

    return NextResponse.json({ user: toSafeUser(dbUser) });
  } catch (err) {
    console.error("Error in /api/me:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
