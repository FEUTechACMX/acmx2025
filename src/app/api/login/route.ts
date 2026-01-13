// Login API
import { NextResponse } from "next/server";
import { login } from "../../../../services/identity/identityService";

export async function POST(req: Request) {
  const { studentId, password } = await req.json();

  try {
    const user = await login(studentId, password);
    return NextResponse.json({ success: true, user });
  } catch (err) {
    let message = "Unable to Log In. Please try again later.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
