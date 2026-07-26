import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import EventsManager from "@/components/admin/EventsManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const dbUser = await getCurrentUser();
  return <EventsManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
