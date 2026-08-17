import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isAdmin, USER_ROLES } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List all members with their role, for the People & Roles page.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: {
        studentId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        schoolEmail: true,
        role: true,
        createdAt: true,
      },
    });

    const counts: Record<string, number> = {};
    for (const r of USER_ROLES) counts[r] = 0;
    for (const u of users) counts[u.role] = (counts[u.role] ?? 0) + 1;

    return NextResponse.json({
      users: users.map((u) => ({
        studentId: u.studentId,
        name: [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" "),
        email: u.schoolEmail,
        role: u.role,
        joined: u.createdAt,
      })),
      counts,
    });
  } catch (err) {
    console.error("admin/users error:", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
