import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Console · ACM X",
};

// ADMIN-only gate for the whole console. Middleware already ensures the visitor
// is signed in; here we enforce the role.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getCurrentUser();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser.role)) redirect("/dashboard");
  return <>{children}</>;
}
