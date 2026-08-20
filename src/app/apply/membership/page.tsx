import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { membershipWindow } from "@/lib/campaign-windows";
import MembershipApplyPage from "@/components/apply/MembershipApplyPage";
import MembershipWindowClosed from "@/components/apply/MembershipWindowClosed";

export const dynamic = "force-dynamic";

export default async function ApplyMembershipPage() {
  const user = await getCurrentUser();
  if (user?.membershipStatus === "APPROVED") {
    // Renewal UX is PARKED (SPEC-D5 §11) — stub still routes to the renew page /
    // login CTA path already built; do not expand renewal logic here.
    redirect("/apply/membership/renew");
  }

  const window = membershipWindow();
  if (!window.open) {
    return <MembershipWindowClosed window={window} />;
  }

  return <MembershipApplyPage />;
}
