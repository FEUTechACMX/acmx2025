import { NextRequest, NextResponse } from "next/server";
import { TimeIn, TimeOut } from "@/services/scanner/scannerService";
import type { QrPayload } from "@/lib/qrParser";

export async function POST(req: NextRequest) {
  try {
    const { scanType, payload, eventId } = await req.json();

    if (!scanType || !payload || !eventId) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: scanType, payload, eventId" },
        { status: 400 }
      );
    }

    const qrPayload: QrPayload = payload;

    if (scanType === "TimeIn") {
      const result = await TimeIn(qrPayload, eventId);
      return NextResponse.json({
        ok: result.success,
        message: result.message,
        data: result,
      });
    } else if (scanType === "TimeOut") {
      const result = await TimeOut(qrPayload, eventId);
      return NextResponse.json({
        ok: result.success,
        message: result.message,
        data: result,
      });
    } else {
      return NextResponse.json(
        { ok: false, error: "Invalid scanType. Use 'TimeIn' or 'TimeOut'" },
        { status: 400 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record attendance";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
