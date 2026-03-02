import React from "react";
import Events from "@/components/events/Events";

export default function page() {
  return (
    <div className="min-h-screen flex items-start relative before:absolute before:top-0 before:left-0 before:w-full before:h-full before:content-[''] before:opacity-[0.05] before:z-10 before:pointer-events-none before:bg-[url('https://www.ui-layouts.com/noise.gif')]">
      <Events />
    </div>
  );
}
