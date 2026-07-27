import React from "react";
import { getCurrentUser } from "@/lib/auth";
import Storefront from "@/components/merch/Storefront";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merchandise · ACMX",
};

export default async function MerchandisePage() {
  const user = await getCurrentUser();
  return <Storefront signedIn={!!user} />;
}
