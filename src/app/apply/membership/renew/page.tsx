import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import MembershipRenewPage from "@/components/apply/MembershipRenewPage";

export const dynamic = "force-dynamic";

export default async function RenewMembershipPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser) redirect("/login");
  if (dbUser.membershipStatus !== "APPROVED") redirect("/");
  const user = toSafeUser(dbUser);
  if (!user) redirect("/");
  return <MembershipRenewPage user={user} />;
}
