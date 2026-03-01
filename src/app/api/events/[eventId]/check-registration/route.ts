import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Check if the current user is registered for an event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ registered: false });
    }

    const registration = await prisma.registration.findFirst({
      where: {
        eventId,
        OR: [
          { userId: user.id },
          { schoolEmail: user.schoolEmail },
          { studentNumber: user.studentId },
        ],
      },
      select: { id: true },
    });

    return NextResponse.json({ registered: !!registration });
  } catch (err) {
    console.error("Error checking registration:", err);
    return NextResponse.json({ registered: false });
  }
}
