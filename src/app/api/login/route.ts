// app/api/login/route.ts
import { NextResponse } from "next/server";
import {
  login,
  createSession,
} from "@/services/identity/identityService";

export async function POST(req: Request) {
  const { studentId, password } = await req.json();

  try {
    // Step 1: verify credentials (login returns the user)
    const user = await login(studentId, password);

    // Step 2: create session in DB and get sessionId
    const sessionId = await createSession(user.studentId);

    // Step 3: create response and set cookie
    const res = NextResponse.json({ success: true, user });
    res.cookies.set({
      name: "session",
      value: sessionId,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    let message = "Unable to Log In. Please try again later.";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
