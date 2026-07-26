import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import MerchandiseManager from "@/components/admin/MerchandiseManager";

export const dynamic = "force-dynamic";

export default async function AdminMerchandisePage() {
  const dbUser = await getCurrentUser();
  return <MerchandiseManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
