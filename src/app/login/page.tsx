import LoginPage from "@/components/login/login";
import { membershipWindowOpen } from "@/lib/campaign-windows";

export const dynamic = "force-dynamic";

export default function Page() {
  return <LoginPage membershipOpen={membershipWindowOpen()} />;
}
