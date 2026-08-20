import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";
import InterviewSlotsManager from "@/components/admin/InterviewSlotsManager";

export const dynamic = "force-dynamic";

export default async function AdminInterviewSlotsPage() {
  const dbUser = await getCurrentUser();
  return <InterviewSlotsManager user={dbUser ? toSafeUser(dbUser) : undefined} />;
}
