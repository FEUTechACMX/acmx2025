import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import PeopleRoles from "@/components/admin/PeopleRoles";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage() {
  const dbUser = await getCurrentUser();
  return <PeopleRoles user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
