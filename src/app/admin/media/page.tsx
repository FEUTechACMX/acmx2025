import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const dbUser = await getCurrentUser();
  return <MediaLibrary user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
