import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, RegistrationRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      userId,
      fullName,
      studentNumber,
      schoolEmail,
      contactNumber,
      facebookLink,
      yearLevel,
      section,
      professor,
      degreeProgram,
    } = body;

    // 🔹 1. Duplicate check — covers all 3 unique constraints
    const existing = await prisma.registration.findFirst({
      where: {
        eventId,
        OR: [
          ...(userId ? [{ userId }] : []),
          { schoolEmail },
          { studentNumber },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    // 🔹 2. Create registration record
    const registration = await prisma.registration.create({
      data: {
        userId: userId || null,
        eventId,
        fullName,
        studentNumber,
        schoolEmail,
        contactNumber,
        facebookLink,
        yearLevel: parseInt(yearLevel, 10),
        section,
        professor,
        degreeProgram,
        role: userId ? RegistrationRole.MEMBER : RegistrationRole.NON_MEMBER,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error: unknown) {
    // Catch Prisma unique constraint violations as a safety net
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    if (error instanceof Error) {
      console.error("Unexpected error (registrations):", error.message);
      return NextResponse.json(
        { error: "Unexpected server error.", details: error.message },
        { status: 500 }
      );
    }

    console.error("Unknown error (registrations):", error);
    return NextResponse.json(
      { error: "Unknown error occurred." },
      { status: 500 }
    );
  }
}
