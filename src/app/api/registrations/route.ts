// app/api/registrations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { RegistrationRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      userId, // null if non-member
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

    // 🔍 1. Check if already registered
    if (userId) {
      // member duplicate check
      const existing = await prisma.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "You are already registered for this event." },
          { status: 409 }
        );
      }
    } else {
      // non-member duplicate check → use schoolEmail OR studentNumber
      const existing = await prisma.registration.findFirst({
        where: {
          eventId,
          OR: [{ schoolEmail }, { studentNumber }],
        },
      });
      if (existing) {
        return NextResponse.json(
          {
            error:
              "This email/student number is already registered for this event.",
          },
          { status: 409 }
        );
      }
    }

    // 2. Create registration
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
  } catch (error: any) {
    console.error("Error creating registration:", error);
    return NextResponse.json(
      { error: "Something went wrong while registering." },
      { status: 500 }
    );
  }
}
