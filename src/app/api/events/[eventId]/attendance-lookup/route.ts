import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required
// GET /api/events/[eventId]/attendance-lookup?studentNumber=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const studentNumber = req.nextUrl.searchParams.get("studentNumber");

    if (!studentNumber) {
      return NextResponse.json(
        { error: "studentNumber query param is required" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        eventId,
        studentNumber,
      },
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
    });

    if (!attendance) {
      return NextResponse.json(
        { found: false, message: "No attendance record found for this student number." },
        { status: 404 }
      );
    }

    return NextResponse.json({ found: true, attendance });
  } catch (err) {
    console.error("Attendance lookup error:", err);
    return NextResponse.json(
      { error: "Failed to look up attendance" },
      { status: 500 }
    );
  }
}
