// components/events/Events.tsx
import React from "react";
import EventsList from "./EventsList";

export default function Events() {
  return (
    <div className="min-h-screen bg-black flex flex-col gap-10 items-center justify-around p-10">
      {/* Show 1st semester events */}
      <EventsList semester="2nd" />
    </div>
  );
}
