// Login API
import { NextResponse } from "next/server";
import { login } from "../../../../services/identity/identityService";

export async function POST(req: Request) {
  const { studentId, password } = await req.json();

  try {
    const user = await login(studentId, password);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 401 }
    );
  }
}
