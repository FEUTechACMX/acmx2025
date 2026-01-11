//imports
import { cookies } from "next/headers";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

//To Do:

//Scanner functions

//Member verification
//Check if QR details have a match in the User Model.
export async function UserVerification(
  studentNumber: string,
  studentFirstName: string,
  studentLastName: string
) {
  const verify = await prisma.user.findUnique({
    where: {
      studentId: studentNumber,
      firstName: studentFirstName,
      lastName: studentLastName,
    },
  });

  if (!verify) {
    throw new Error("User Does not exist in our system");
  } else {
    return verify;
  }
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

  return user;
}

//Create session
export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 24 * 7),
    },
  });
  const cookieStore = await cookies();

  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

//Log Out
export async function logOut() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (sessionId) {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  cookieStore.delete("session");
}
