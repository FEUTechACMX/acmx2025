import { NextRequest, NextResponse } from "next/server";
import { decryptAES } from "../../../../../lib/crypto";
import { parseQrPayload } from "../../../../../lib/qrParser";
import { prisma } from "../../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { encrypted } = await req.json();

    if (!encrypted || typeof encrypted !== "string") {
      return NextResponse.json(
        { error: "Missing 'encrypted'" },
        { status: 400 }
      );
    }

    const key = process.env.QR_SECRET_KEY || "";
    if (!key) {
      return NextResponse.json(
        { error: "Server is missing QR_SECRET_KEY" },
        { status: 500 }
      );
    }

    // Decrypt QR and parse
    const decrypted = decryptAES(encrypted, key);
    const payload = parseQrPayload(decrypted);

    if (!payload.studentID) {
      return NextResponse.json(
        { error: "QR is missing studentID" },
        { status: 400 }
      );
    }

    // ✅ Just check if user exists
    const user = await prisma.user.findUnique({
      where: { studentId: payload.studentID },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "No user found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "User verified",
        user: {
          id: user.id,
          studentId: user.studentId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
