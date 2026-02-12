import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegistrationRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
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

    // Duplicate check — prevent same student from registering twice
    const existing = await prisma.registration.findFirst({
      where: {
        eventId,
        OR: [{ schoolEmail }, { studentNumber }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This email/student number is already registered for this event." },
        { status: 409 }
      );
    }

    const registration = await prisma.registration.create({
      data: {
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
        role: RegistrationRole.NON_MEMBER,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Error completing registration:", error);
    return NextResponse.json(
      { error: "Failed to complete registration." },
      { status: 500 }
    );
  }
}
