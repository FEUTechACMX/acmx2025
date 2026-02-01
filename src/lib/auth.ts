//Single source of truth
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export const dynamic = "force-dynamic";

export async function getCurrentUser(req?: NextRequest) {
  let sessionId: string | undefined;

  if (req) {
    // middleware /API route
    const cookie = req.cookies.get("session");
    sessionId = cookie?.value;
  } else {
    const cookieStore = await import("next/headers").then((m) => m.cookies());
    sessionId = cookieStore.get("session")?.value;
  }

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}
