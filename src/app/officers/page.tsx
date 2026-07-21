import React from "react";
import ComingSoon from "@/components/placeholder/ComingSoon";

export default function OfficersPage() {
  return (
    <ComingSoon
      eyebrow={["ELECTED", "TO", "SERVE"]}
      title="OFFICERS"
      intro="The elected officers of the FEU Tech ACM Student Chapter for the current academic year. Portraits, portfolios, and terms of service will be listed here."
      detail={[
        { label: "Status", value: "In development" },
        { label: "Term", value: "A.Y. 2025–2026" },
        { label: "Elections", value: "Held annually" },
        { label: "Enquiries", value: "acm.feu.it@gmail.com" },
      ]}
    />
  );
}
