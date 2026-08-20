import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import JoApplicationsManager from "@/components/admin/JoApplicationsManager";

export const dynamic = "force-dynamic";

export default async function AdminJoPage() {
  const dbUser = await getCurrentUser();
  return <JoApplicationsManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
