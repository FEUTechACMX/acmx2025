import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import CommitteesManager from "@/components/admin/CommitteesManager";

export const dynamic = "force-dynamic";

export default async function AdminCommitteesPage() {
  const dbUser = await getCurrentUser();
  return <CommitteesManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
