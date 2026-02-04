import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import SettingsContent from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const dbUser = await getCurrentUser();
  
  if (!dbUser) {
    redirect("/");
  }

  const user = toSafeUser(dbUser);

  return <SettingsContent user={user} />;
}
