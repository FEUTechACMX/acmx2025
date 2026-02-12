//imports
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

//To Do:

//Scanner functions

//Member verification
//Check if QR details have a match in the User Model.
export async function userVerification(
  studentNumber: string,
  studentFirstName: string,
  studentLastName: string
) {
  const user = await prisma.user.findUnique({
    where: { studentId: studentNumber },
  });

  if (!user) {
    throw new Error("User does not exist in our system");
  }

  if (user.firstName !== studentFirstName || user.lastName !== studentLastName) {
    throw new Error("Name does not match records");
  }

  return user;
}

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

