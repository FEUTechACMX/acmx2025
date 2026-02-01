import { NextRequest, NextResponse } from "next/server";
import { getEventsBySemester } from "@/lib/events";

// ✅ Route handler for /api/events/[semester]
export async function GET(
  _req: NextRequest,
  { params }: { params: { semester: string } }
) {
  try {
    // semester is already typed as string
    const events = await getEventsBySemester(params.semester);

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    // normalize error handling
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
