import React from "react";
import ComingSoon from "@/components/placeholder/ComingSoon";

export default function MerchandisePage() {
  return (
    <ComingSoon
      eyebrow={["WEAR", "THE", "CHAPTER"]}
      title="MERCHANDISE"
      intro="Chapter apparel, stickers, and lanyards — designed by ACM members, produced for ACM members. The storefront is being built and will open ahead of the next event series."
      detail={[
        { label: "Status", value: "In development" },
        { label: "Launch", value: "Next event series" },
        { label: "Fulfilment", value: "On-campus pickup" },
        { label: "Enquiries", value: "acm.feu.it@gmail.com" },
      ]}
    />
  );
}
