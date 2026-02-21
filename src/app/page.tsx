import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const dbUser = await getCurrentUser();

  if (dbUser) {
    redirect("/dashboard");
  }

  redirect("/hero");
}
