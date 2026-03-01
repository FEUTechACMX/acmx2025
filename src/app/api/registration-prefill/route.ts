import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get section & professor from most recent schedule
    const latestSchedule = await prisma.schedule.findFirst({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    const fullName = [
      dbUser.firstName,
      dbUser.middleName,
      dbUser.lastName,
      dbUser.suffix,
    ]
      .filter(Boolean)
      .join(" ");

    return NextResponse.json({
      userId: dbUser.id,
      studentNumber: dbUser.studentId,
      fullName,
      schoolEmail: dbUser.schoolEmail,
      contactNumber: dbUser.contactNumber,
      facebookLink: dbUser.facebookLink,
      yearLevel: String(dbUser.yearLevel),
      degreeProgram: dbUser.degreeProgram,
      section: latestSchedule?.section ?? "",
      professor: latestSchedule?.professor ?? "",
    });
  } catch (err) {
    console.error("Error in /api/registration-prefill:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
