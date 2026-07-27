import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CartPage from "@/components/merch/CartPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your cart · ACMX Merchandise",
};

// The cart belongs to an account, so signed-out visitors go back to the store
// rather than seeing an empty basket they can never fill.
export default async function MerchandiseCartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/merchandise");
  return <CartPage />;
}
