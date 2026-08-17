import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import CommitteeEditor from "@/components/admin/CommitteeEditor";

export const dynamic = "force-dynamic";

/**
 * One committee, full width. `id` is a committee id or the literal "new" —
 * the editor asks the API for the record either way, and the API is what
 * decides whether this viewer may edit it or only read it.
 */
export default async function AdminCommitteeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbUser = await getCurrentUser();
  return <CommitteeEditor user={dbUser ? toSafeUser(dbUser) : undefined} id={id} />;
}
