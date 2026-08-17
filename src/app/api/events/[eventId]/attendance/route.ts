import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EVENT_ADMIN_ROLES, isEventAdmin } from "@/types/auth";

// GET — fetch attendance records (safe fields only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;
    const user = auth.user;

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
