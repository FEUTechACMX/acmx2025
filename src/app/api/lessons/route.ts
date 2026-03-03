import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OFFICER_ROLES } from "@/types/auth"; // We'll allow any officer role to upload lessons

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authorize: Ensure user is an Officer or Admin
    const user = await getCurrentUser(req as any);
    if (!user || !OFFICER_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Parse body
    const body = await req.json();
    const { title, author, fileUrl, slideCount } = body;

    // 3. Validate
    if (!title || !author || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields (title, author, fileUrl)." },
        { status: 400 }
      );
    }

    // 4. Insert
    const newLesson = await prisma.lesson.create({
      data: {
        title,
        author,
        fileUrl,
        slideCount: parseInt(slideCount) || 0,
      },
    });

    return NextResponse.json({ lesson: newLesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
