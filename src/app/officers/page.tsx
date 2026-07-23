import React from "react";
import OfficersRoster from "@/components/officers/OfficersRoster";

export const metadata = {
  title: "Officers · FEU Tech ACM",
  description: "The elected officers of the FEU Tech ACM Student Chapter — A.Y. 2025–2026.",
};

export default function OfficersPage() {
  return <OfficersRoster />;
}
