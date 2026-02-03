import { NextRequest, NextResponse } from "next/server";
import {
  verifyScannedQR,
  verifyUserFromQr,
} from "@/services/scanner/scannerService";

export async function POST(req: NextRequest) {
  try {
    const { encrypted } = await req.json();

    if (!encrypted || typeof encrypted !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing 'encrypted' payload" },
        { status: 400 }
      );
    }

    // Decrypt and parse QR payload
    const payload = await verifyScannedQR(encrypted);

    // Verify user exists in database
    const user = await verifyUserFromQr(payload);

    return NextResponse.json({
      ok: true,
      message: "User verified",
      payload,
      user: {
        id: user.id,
        studentId: user.studentId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process QR";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
