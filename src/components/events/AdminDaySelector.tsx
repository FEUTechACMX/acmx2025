"use client";

import { useState } from "react";
import AdminEventPanel from "./AdminEventPanel";

interface SubEvent {
  eventId: string;
  name: string;
  startDate: string;
}

interface AdminDaySelectorProps {
  event: {
    eventId: string;
    name: string;
    subEvents: SubEvent[];
  };
}

export default function AdminDaySelector({ event }: AdminDaySelectorProps) {
  const hasMultipleDays = event.subEvents.length > 0;
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Build the list of days: parent + each sub-event
  const days = hasMultipleDays
    ? [
        { eventId: event.eventId, label: "Overview", name: event.name },
        ...event.subEvents.map((sub, idx) => ({
          eventId: sub.eventId,
          label: `Day ${idx + 1}`,
          name: sub.name,
        })),
      ]
    : [{ eventId: event.eventId, label: "All", name: event.name }];

  const activeDay = days[selectedDayIdx];

  return (
    <div>
      {/* Day tabs — only show when multi-day */}
      {hasMultipleDays && (
        <div className="mb-6">
          <p className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-3">
            Select Day
          </p>
          <div className="inline-flex border border-gray-200">
            {days.map((day, idx) => (
              <button
                key={day.eventId}
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-4 py-2 text-xs font-['Arian-bold'] uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedDayIdx === idx
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                } ${idx > 0 ? "border-l border-gray-200" : ""}`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {selectedDayIdx > 0 && (
            <p className="mt-2 text-xs font-['Arian-light'] text-gray-400">
              {activeDay.name}
            </p>
          )}
        </div>
      )}

      {/* Admin panel for the selected day */}
      <AdminEventPanel key={activeDay.eventId} eventId={activeDay.eventId} />
    </div>
  );
}
