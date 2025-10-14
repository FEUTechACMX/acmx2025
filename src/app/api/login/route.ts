import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  const { studentId, password } = await req.json();

  if (!studentId || !password)
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { studentId },
  });

  if (!user)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = jwt.sign(
    { userId: user.id, studentId: user.studentId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const res = NextResponse.json({ message: "Login successful" });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return res;
}
