import React from "react";
import Events from "@/components/events/Events";
import { Surface } from "@/components/ds";

export default function Page() {
  return (
    <Surface corners="bottom-right">
      <Events />
    </Surface>
  );
}
