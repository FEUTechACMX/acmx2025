import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_ADMIN_ROLES } from "@/types/auth";

// GET — fetch attendance records (safe fields only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !EVENT_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { eventId } = await params;

    const attendance = await prisma.attendance.findMany({
      where: { eventId },
      select: {
        fullName: true,
        studentNumber: true,
        schoolEmail: true,
        yearLevel: true,
        degreeProgram: true,
        section: true,
        timeIn: true,
        timeOut: true,
        role: true,
      },
      orderBy: { timeIn: "desc" },
    });

    return NextResponse.json({ attendance });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
