import { NextRequest, NextResponse } from "next/server";
import { decryptAES } from "@/lib/crypto";
import { parseQrPayload } from "@/lib/qrParser";
import { prisma } from "@/lib/prisma";

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
        { error: "Server missing QR_SECRET_KEY" },
        { status: 500 }
      );
    }

    const decrypted = decryptAES(encrypted, key);
    const payload = parseQrPayload(decrypted);

    if (!payload.studentID) {
      return NextResponse.json(
        { error: "QR missing studentID" },
        { status: 400 }
      );
    }

    // 💡 ADDED: explicitly select role along with name and ID
    const user = await prisma.user.findUnique({
      where: { studentId: payload.studentID },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        role: true, // ✅ new
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "No user found" },
        { status: 404 }
      );
    }

    // 💡 CLEANED: simplified return — no need to restructure user
    return NextResponse.json({
      ok: true,
      message: "User verified",
      user,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to verify QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
