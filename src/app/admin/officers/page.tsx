import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import OfficersManager from "@/components/admin/OfficersManager";

export const dynamic = "force-dynamic";

export default async function AdminOfficersPage() {
  const dbUser = await getCurrentUser();
  return <OfficersManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
