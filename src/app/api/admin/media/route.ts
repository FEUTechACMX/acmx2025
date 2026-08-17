import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MediaItem = {
  url: string;
  eventId: string;
  eventName: string;
  kind: "cover" | "card" | "gallery";
  galleryIndex?: number;
};

// Aggregates every image referenced across events into one library. There is no
// central Media table — the site stores images on events (image/cardImage/
// gallery), so we surface those with where-used context. "Take down" is handled
// by the event edit route (clearing the reference).
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const events = await prisma.event.findMany({
      select: { eventId: true, name: true, image: true, cardImage: true, gallery: true },
    });

    const items: MediaItem[] = [];
    for (const e of events) {
      if (e.image) items.push({ url: e.image, eventId: e.eventId, eventName: e.name, kind: "cover" });
      if (e.cardImage) items.push({ url: e.cardImage, eventId: e.eventId, eventName: e.name, kind: "card" });
      (e.gallery ?? []).forEach((url, i) => {
        if (url) items.push({ url, eventId: e.eventId, eventName: e.name, kind: "gallery", galleryIndex: i });
      });
    }

    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error("admin/media error:", err);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
