// components/events/Events.tsx
"use client";

import React, { useState } from "react";
import EventsList from "./EventsList";
import EventSelector from "./EventSelector";

export default function Events() {
  const [semester, setSemester] = useState("1st");

  return (
    <div className="flex flex-col justify-center items-center w-full max-w-6xl mx-auto px-4 sm:px-6 relative">
      <div className="text-center mb-8 sm:mb-12 md:mb-20">
        <h1 className="text-5xl sm:text-7xl md:text-[96px] mt-[66px] font-['Fjalla-One'] text-[#CF78EC] leading-none">ACM EVENTS</h1>
      </div>
      
      <div className="relative z-20 w-full flex flex-col items-center">
        <EventSelector onChange={setSemester} />
        <EventsList semester={semester} />
      </div>
    </div>
  );
}
