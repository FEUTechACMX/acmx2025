import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { committeeScope } from "@/lib/committee-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Console · ACMX",
};

/**
 * The console's role gate. Middleware already ensures the visitor is signed in.
 *
 * The top table — ADMIN, PRESIDENT, VP_INTERNAL, VP_EXTERNAL — gets everything.
 * Anyone holding a committee seat gets in as far as /admin/committees and no
 * further, where the API scopes them to their own committee and decides whether
 * they can edit it or only read it. Everyone else goes back to the dashboard.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await getCurrentUser();
  if (!dbUser) redirect("/");
  if (isAdmin(dbUser.role)) return <>{children}</>;

  const scope = await committeeScope(dbUser);
  if (!scope.hasAny) redirect("/dashboard");

  // A layout can't see the request path on its own — the middleware stamps it.
  const path = (await headers()).get("x-pathname") ?? "";
  if (path && !path.startsWith("/admin/committees")) redirect("/admin/committees");

  return <>{children}</>;
}
