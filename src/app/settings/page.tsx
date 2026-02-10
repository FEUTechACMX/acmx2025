import { requireAuth } from "@/lib/auth";
import SettingsContent from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const user = await requireAuth();

  return <SettingsContent user={user} />;
}
