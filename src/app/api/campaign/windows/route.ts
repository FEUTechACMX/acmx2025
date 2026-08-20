import { NextResponse } from "next/server";
import { joWindow, membershipWindow } from "@/lib/campaign-windows";

export const dynamic = "force-dynamic";

/** Public window status for client shells (login modal). No secrets. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    membership: membershipWindow(),
    jo: joWindow(),
  });
}
