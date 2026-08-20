import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { joWindow } from "@/lib/campaign-windows";
import JoApplyPage from "@/components/apply/JoApplyPage";
import { Surface, Column, PageHeader, Body } from "@/components/ds";

export const dynamic = "force-dynamic";

export default async function ApplyJoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/apply/membership");
  if (user.membershipStatus !== "APPROVED") redirect("/dashboard");

  const window = joWindow();
  if (!window.open) {
    const copy =
      window.phase === "before" && window.start
        ? `Junior Officer applications open ${window.start}.`
        : window.phase === "after" && window.end
          ? `Junior Officer applications closed on ${window.end}.`
          : "Junior Officer applications are not open right now.";
    return (
      <Surface corners="top-left">
        <Column>
          <PageHeader
            eyebrow={["JUNIOR", "OFFICER"]}
            title={
              <>
                JO WINDOW
                <br />
                CLOSED
              </>
            }
            intro={<Body>{copy}</Body>}
          />
        </Column>
      </Surface>
    );
  }

  return <JoApplyPage />;
}
