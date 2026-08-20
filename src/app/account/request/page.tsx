import { redirect } from "next/navigation";

/** Merged claim/forgot page removed (SPEC-D5 §13) — default to claim. */
export default function AccountRequestRedirect() {
  redirect("/account/claim-account");
}
