import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_ADMIN_ROLES } from "@/types/auth";

export const dynamic = "force-dynamic";

// SSE stream — sends attendance data every 3 seconds
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user || !EVENT_ADMIN_ROLES.includes(user.role)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { eventId } = await params;

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (cancelled) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send data on an interval
      const poll = async () => {
        while (!cancelled) {
          try {
            const attendance = await prisma.attendance.findMany({
              where: { eventId },
              select: {
                fullName: true,
                studentNumber: true,
                schoolEmail: true,
                yearLevel: true,
                degreeProgram: true,
                section: true,
                timeIn: true,
                timeOut: true,
                role: true,
              },
              orderBy: { timeIn: "desc" },
            });

            send({ attendance, timestamp: new Date().toISOString() });
          } catch (err) {
            console.error("SSE poll error:", err);
          }

          // Wait 3 seconds before next poll
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      };

      poll();
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
