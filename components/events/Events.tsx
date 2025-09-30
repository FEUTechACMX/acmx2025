// components/events/Events.tsx
"use client";

import React, { useState } from "react";
import EventsList from "./EventsList";
import EventSelector from "./EventSelector";

export default function Events() {
  const [semester, setSemester] = useState("1st");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-10">
      <EventSelector onChange={setSemester} />

      {/* Pass selected semester into the list */}
      <EventsList semester={semester} />
    </div>
  );
}
