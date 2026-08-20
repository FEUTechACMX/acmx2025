import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InterviewScheduler from "@/components/interview/InterviewScheduler";

export const dynamic = "force-dynamic";

export default async function InterviewSchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const application = await prisma.jOApplication.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  if (!application || application.status !== "SHORTLISTED") notFound();
  return <InterviewScheduler />;
}
