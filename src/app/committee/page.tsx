import React from "react";
import ComingSoon from "@/components/placeholder/ComingSoon";

export default function CommitteePage() {
  return (
    <ComingSoon
      eyebrow={["THE", "PEOPLE", "BEHIND", "ACMX"]}
      title="COMMITTEE"
      intro="Committees carry the chapter's work between events — creatives, technicals, logistics, and externals. Member rosters and open calls will be published here."
      detail={[
        { label: "Status", value: "In development" },
        { label: "Committees", value: "Creatives · Technicals · Logistics · Externals" },
        { label: "Applications", value: "Opens each term" },
        { label: "Enquiries", value: "acm.feu.it@gmail.com" },
      ]}
    />
  );
}
