import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSecretariatOrAbove } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentNumber: string }> }
) {
  try {
    const sessionUser = await getCurrentUser(req);
    if (!sessionUser || !isSecretariatOrAbove(sessionUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { studentNumber } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { studentId: studentNumber },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    console.error("Error fetching user details:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
