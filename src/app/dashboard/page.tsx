import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import DashboardHome from "@/components/dashboard/DashboardHome";

export default async function DashboardPage() {
  const dbUser = await getCurrentUser();

  if (!dbUser) {
    redirect("/");
  }

  const user = toSafeUser(dbUser);

  return <DashboardHome user={user} />;
}
