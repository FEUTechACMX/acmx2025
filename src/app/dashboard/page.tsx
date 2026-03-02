import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import DashboardHome from "@/components/dashboard/DashboardHome";
import WithPreloader from "@/components/UI/WithPreLoader";

export default async function DashboardPage() {
  const dbUser = await getCurrentUser();

  if (!dbUser) {
    redirect("/");
  }

  const user = toSafeUser(dbUser);

  return (
    <WithPreloader>
      <DashboardHome user={user} />
    </WithPreloader>
  );
}
