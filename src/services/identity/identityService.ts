//imports
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

//Log-In logic
export async function login(studentId: string, password: string) {
  async function verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  const user = await prisma.user.findUnique({
    where: {
      studentId: studentId,
    },
  });

  if (!user) throw new Error("Invalid Credentials");

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error("Invalid Password");

  // Strip password before returning
  const { password: _, ...safeUser } = user;
  return safeUser;
}

//Create session
// services/identityService.ts
export async function createSession(userId: string) {
  // Clean up expired sessions to prevent table bloat
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const sessionId = crypto.randomUUID();
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  return sessionId;
}

