import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import AccountPage from "@/components/profile/AccountPage";

export default async function ProfilePage() {
  const dbUser = await getCurrentUser();

  if (!dbUser) {
    redirect("/");
  }

  const user = toSafeUser(dbUser);

  // AccountPage reads `?tab=` via useSearchParams, which Next requires to sit
  // inside a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AccountPage user={user} />
    </Suspense>
  );
}
