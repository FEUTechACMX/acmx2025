//Single source of truth
import { prisma } from "./prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  console.log("Session cookie", sessionId);

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}
