// components/events/Events.tsx
"use client";

import React, { useState } from "react";
import EventsList from "./EventsList";
import EventSelector from "./EventSelector";

export default function Events() {
  const [semester, setSemester] = useState("1st");

  return (
    <div className="flex flex-col justify-center items-center w-full max-w-6xl mx-auto px-4 relative before:absolute before:top-0 before:left-0 before:w-full
     before:h-full before:content-[''] before:opacity-[0.05] before:z-10 before:pointer-events-none
     before:bg-[url('https://www.ui-layouts.com/noise.gif')]">
      <div className="text-center mb-12 md:h-[96px]">
        <h1 className="text-4xl mt-[66px] md:text-[96px] font-['Fjalla-One'] text-[#CF78EC]">ACM EVENTS</h1>
      </div>
      
      <EventSelector onChange={setSemester} />
      <EventsList semester={semester} />
    </div>
  );
}
