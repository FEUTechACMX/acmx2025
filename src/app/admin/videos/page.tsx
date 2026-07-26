import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import VideosManager from "@/components/admin/VideosManager";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const dbUser = await getCurrentUser();
  return <VideosManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
