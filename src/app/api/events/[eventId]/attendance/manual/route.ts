import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";
import { recordTimeIn, recordTimeOut } from "@/services/attendance/attendanceService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !isEventAdmin(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { eventId } = await params;
    const body = await req.json();
    const { studentNumber, action = "in" } = body;

    if (!studentNumber) {
      return NextResponse.json({ error: "Student number is required" }, { status: 400 });
    }

    try {
      if (action === "out") {
        const result = await recordTimeOut(studentNumber, eventId);
        return NextResponse.json({ success: true, message: "Time-out recorded." });
      } else {
        const attendance = await recordTimeIn(studentNumber, eventId);
        return NextResponse.json({ success: true, attendance });
      }
    } catch (err: any) {
      if (err.message === "User is not Registered") {
        return NextResponse.json({ error: "No registration found." }, { status: 404 });
      }
      return NextResponse.json({ error: err.message || "Failed to record attendance" }, { status: 400 });
    }
  } catch (err) {
    console.error("Manual attendance error:", err);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}
