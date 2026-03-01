import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_ADMIN_ROLES } from "@/types/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !EVENT_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { eventId } = await params;

    // Fetch registrations for this event
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      select: {
        id: true,
        fullName: true,
        studentNumber: true,
        schoolEmail: true,
        yearLevel: true,
        degreeProgram: true,
        section: true,
        professor: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date for chart data
    const dailyCounts: Record<string, number> = {};
    for (const reg of registrations) {
      const dateKey = new Date(reg.createdAt).toISOString().split("T")[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    }

    const chartData = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      total: registrations.length,
      chartData,
      registrations,
    });
  } catch (err) {
    console.error("Error fetching registrations:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch registrations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
