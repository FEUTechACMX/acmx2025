// components/events/Events.tsx
"use client";

import React, { useState, useEffect } from "react";
import EventsList from "./EventsList";
import EventSelector from "./EventSelector";
import EventCreationModal from "./EventCreationModal";
import { isEventAdmin } from "@/types/auth";

export default function Events() {
  const [semester, setSemester] = useState("1st");
  const [showCreate, setShowCreate] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user && isEventAdmin(data.user.role)) {
            setCanCreate(true);
          }
        }
      } catch { /* not logged in */ }
    }
    checkRole();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center w-full max-w-6xl mx-auto px-4 sm:px-6 relative">
      <div className="text-center mb-8 sm:mb-12 md:mb-20">
        <h1 className="text-5xl sm:text-7xl md:text-[96px] mt-[66px] font-['Fjalla-One'] text-[#CF78EC] leading-none">ACM EVENTS</h1>
      </div>
      
      <div className="relative z-20 w-full flex flex-col items-center">
        {/* Admin: Create Event button */}
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="mb-6 px-5 py-2 text-xs font-['Arian-bold'] text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer uppercase tracking-widest"
          >
            + Create Event
          </button>
        )}

        <EventSelector onChange={setSemester} />
        <EventsList key={refreshKey} semester={semester} />
      </div>

      <EventCreationModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
