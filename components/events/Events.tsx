import React from "react";
import EventCards from "./components/EventCards";

export default function Events() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-around">
      <EventCards />
      <EventCards />
      <EventCards />
    </div>
  );
}
