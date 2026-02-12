import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (session) {
    //Delete session from DB (deleteMany won't throw if already expired/removed)
    await prisma.session.deleteMany({
      where: { id: session.value },
    });
  }

  const res = NextResponse.json({ success: true });

  //clear cookie
  res.cookies.set({
    name: "session",
    value: "",
    maxAge: 0,
    path: "/",
  });

  return res;
}
