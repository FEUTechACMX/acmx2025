import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import MembershipStats from "@/components/admin/MembershipStats";

export const dynamic = "force-dynamic";

export default async function AdminMembershipStatsPage() {
  const dbUser = await getCurrentUser();
  return <MembershipStats user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
