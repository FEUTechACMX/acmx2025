import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import Overview from "@/components/admin/Overview";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const dbUser = await getCurrentUser();
  return <Overview user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
