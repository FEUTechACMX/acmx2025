import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import ProfileContent from "@/components/profile/ProfileContent";

export default async function ProfilePage() {
  const dbUser = await getCurrentUser();

  if (!dbUser) {
    redirect("/");
  }

  const user = toSafeUser(dbUser);

  return <ProfileContent user={user} />;
}
