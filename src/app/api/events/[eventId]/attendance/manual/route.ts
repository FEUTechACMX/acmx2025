import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";
import { recordTimeIn, recordTimeOut } from "@/lib/attendance";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;

    const { eventId } = await params;
    const body = await req.json();
    const { studentNumber, action = "in" } = body;

    if (!studentNumber) {
      return NextResponse.json({ error: "Student number is required" }, { status: 400 });
    }

    try {
      if (action === "out") {
        await recordTimeOut(studentNumber, eventId);
        return NextResponse.json({ success: true, message: "Time-out recorded." });
      }
      const attendance = await recordTimeIn(studentNumber, eventId);
      return NextResponse.json({ success: true, attendance });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record attendance";
      if (message === "User is not Registered") {
        return NextResponse.json({ error: "No registration found." }, { status: 404 });
      }
      // A repeated scan is a conflict, not a bad request — the caller did
      // nothing wrong, the record simply already exists.
      if (message === "Already timed in") {
        return NextResponse.json({ error: "Already checked in." }, { status: 409 });
      }
      if (message === "Already timed out") {
        return NextResponse.json({ error: "Already checked out." }, { status: 409 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (err) {
    console.error("Manual attendance error:", err);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}
