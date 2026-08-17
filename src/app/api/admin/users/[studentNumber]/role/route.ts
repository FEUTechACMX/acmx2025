import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isAdmin, USER_ROLES } from "@/types/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// Assign a role to a member.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentNumber: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;
  const actor = auth.user;

  try {
    const { studentNumber } = await params;
    const { role } = await req.json();

    if (!role || !USER_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Guard against an admin removing their own admin access by accident.
    if (actor.studentId === studentNumber && role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot change your own admin role." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { studentId: studentNumber },
      data: { role: role as UserRole },
      select: { studentId: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("admin/users/role error:", err);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }
}
