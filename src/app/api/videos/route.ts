import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EVENT_ADMIN_ROLES, isEventAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

// GET /api/videos — public list of featured videos, ordered for the slideshow.
export async function GET() {
  try {
    const videos = await prisma.featuredVideo.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ ok: true, videos });
  } catch (err) {
    console.error("Error fetching videos:", err);
    return NextResponse.json({ error: "Failed to fetch videos." }, { status: 500 });
  }
}

// POST /api/videos — admin: add a featured video (uploaded URL or direct URL).
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await req.json();
    const { title, subtitle, videoUrl, redirectUrl, order } = body ?? {};

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: "Missing required fields (title, videoUrl)." },
        { status: 400 }
      );
    }

    const video = await prisma.featuredVideo.create({
      data: {
        title: String(title),
        subtitle: subtitle ? String(subtitle) : null,
        videoUrl: String(videoUrl),
        redirectUrl: redirectUrl ? String(redirectUrl) : null,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
      },
    });

    return NextResponse.json({ ok: true, video }, { status: 201 });
  } catch (err) {
    console.error("Error creating video:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
