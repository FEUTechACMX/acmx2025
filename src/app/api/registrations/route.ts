// app/api/registrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      eventId,
      studentNumber,
      fullName,
      schoolEmail,
      contactNumber,
      facebookLink,
      yearLevel,
      section,
      professor,
      degreeProgram,
      // optional
      userId: incomingUserId,
    } = body;

    if (!eventId || !studentNumber || !fullName || !schoolEmail) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (eventId, studentNumber, fullName, schoolEmail).",
        },
        { status: 400 }
      );
    }

    // If userId is present → MEMBER, otherwise NON_MEMBER
    const userId: string | null = incomingUserId ?? null;
    const role = userId ? "MEMBER" : "NON_MEMBER";

    // Duplicate check
    const existing = await prisma.registration.findFirst({
      where: {
        eventId,
        OR: [
          userId ? { userId } : undefined,
          !userId ? { schoolEmail } : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId,
        fullName,
        studentNumber,
        schoolEmail,
        contactNumber: contactNumber ?? null,
        facebookLink: facebookLink ?? null,
        yearLevel: Number(yearLevel) || null,
        section: section ?? null,
        professor: professor ?? null,
        degreeProgram: degreeProgram ?? null,
        role, // always MEMBER or NON_MEMBER
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/registrations error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
