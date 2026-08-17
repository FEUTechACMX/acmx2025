import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import EventEditor from "@/components/admin/EventEditor";

export const dynamic = "force-dynamic";

/** One event, full width — details, cover and the attendance sheet. */
export default async function AdminEventEditorPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const dbUser = await getCurrentUser();
  return <EventEditor user={dbUser ? toSafeUser(dbUser) : undefined} eventId={eventId} />;
}
