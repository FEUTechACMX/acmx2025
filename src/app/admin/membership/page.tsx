import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import MembershipManager from "@/components/admin/MembershipManager";

export const dynamic = "force-dynamic";

export default async function AdminMembershipPage() {
  const dbUser = await getCurrentUser();
  return <MembershipManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
