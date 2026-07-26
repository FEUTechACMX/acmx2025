import { redirect } from "next/navigation";

/**
 * Settings folded into the account page. Kept as a redirect so existing links,
 * bookmarks and the nav dropdown don't 404.
 */
export default function SettingsPage() {
  redirect("/profile?tab=account");
}
