import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clientAddress,
  createThrottle,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const boothStreamByAddress = createThrottle({ windowMs: 60_000, max: 8 });

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Member";
}

export async function GET(req: NextRequest) {
  const eventId = process.env.BOOTH_EVENT_ID?.trim();
  if (!eventId) {
    return new Response(JSON.stringify({ error: "Booth is not configured." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const limited = boothStreamByAddress.check(clientAddress(req));
  if (!limited.allowed) {
    return new Response(JSON.stringify({ error: "Too many live connections." }), {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfter), "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (cancelled) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      while (!cancelled) {
        try {
          const rows = await prisma.registration.findMany({
            where: { eventId },
            orderBy: { createdAt: "desc" },
            select: { fullName: true },
            take: 40,
          });
          const count = await prisma.registration.count({ where: { eventId } });
          send({
            count,
            recentFirstNames: rows.map((r) => firstName(r.fullName)),
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.error("booth SSE:", err);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
