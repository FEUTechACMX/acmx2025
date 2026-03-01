"use client";

import { EventWithCount, getEventStatus } from "@/types/events";
import AttendButton from "./AttendButton";
import Link from "next/link";
import { useState, useEffect } from "react";
import { isOfficer } from "@/types/auth";

interface SelectedEventProps {
  event: EventWithCount;
}

const SelectedEvent = ({ event }: SelectedEventProps) => {
  const hasSubEvents = event.subEvents && event.subEvents.length > 0;

  // For multi-day events, selectedDay tracks which sub-event's context to show.
  // Day 0 = the parent overview (no registration), Day 1+ = sub-events.
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [priceTier, setPriceTier] = useState<"officer" | "member" | "nonmember">("nonmember");

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setPriceTier(isOfficer(data.user.role) ? "officer" : "member");
          }
        }
      } catch { /* not logged in */ }
    }
    fetchUserRole();
  }, []);

  // Determine which event context to use for registration
  const activeEvent: EventWithCount = hasSubEvents && selectedDayIndex > 0
    ? event.subEvents![selectedDayIndex - 1]
    : event;

  const status = getEventStatus(event);
  const isFinished = status === "finished";
  const isOngoing = status === "ongoing";
  const canRegister = !isFinished && !isOngoing;
  const hasGallery = event.gallery && event.gallery.length > 0;

  // For display: show the active sub-event's date/venue when a day is selected
  const displayDate = activeEvent.startDate;
  const displayVenue = activeEvent.venue;

  return (
    <div className="min-h-screen bg-white">
      {/* Back navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-['Arian-light'] text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest">
                ACM Event
              </p>
              {/* Status badge */}
              <StatusBadge status={status} />
              {event.isMultiDay && (
                <span className="text-[10px] font-['Arian-bold'] uppercase tracking-widest px-2 py-0.5 bg-gray-900 text-white">
                  Multi-Day
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-['Fjalla-One'] text-gray-900 leading-none">
              {event.name}
            </h1>
            <p className="text-gray-400 font-['Arian-light'] text-sm mt-3">
              Hosted by ACM · FEU Tech
            </p>
          </div>

          {/* Register button — only for upcoming events */}
          {canRegister && (
            <div className="shrink-0">
              {hasSubEvents && selectedDayIndex === 0 ? (
                <p className="text-xs font-['Arian-light'] text-gray-400 italic">
                  Select a day below to register
                </p>
              ) : (
                <AttendButton eventId={activeEvent.eventId} />
              )}
            </div>
          )}
        </div>

        {/* Day Selector Tabs (multi-day events) */}
        {hasSubEvents && (
          <div className="mt-6">
            <div className="inline-flex border border-gray-200">
              <button
                onClick={() => setSelectedDayIndex(0)}
                className={`px-4 py-2 text-xs font-['Arian-bold'] uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedDayIndex === 0
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Overview
              </button>
              {event.subEvents!.map((sub, idx) => (
                <button
                  key={sub.eventId}
                  onClick={() => setSelectedDayIndex(idx + 1)}
                  className={`px-4 py-2 text-xs font-['Arian-bold'] uppercase tracking-wider transition-colors cursor-pointer border-l border-gray-200 ${
                    selectedDayIndex === idx + 1
                      ? "bg-[#CF78EC] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Day {idx + 1} —{" "}
                  {new Date(sub.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-gray-100 mt-6" />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Gallery — for ongoing/finished events */}
            {(isFinished || isOngoing) && hasGallery && (
              <div>
                <h2 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
                  Photos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {event.gallery!.map((url: string, i: number) => (
                    <div key={i} className="aspect-square overflow-hidden border border-gray-100 bg-gray-50">
                      <img
                        src={url}
                        alt={`${event.name} photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event image (upcoming/single-day) */}
            {!isFinished && !isOngoing && (
              <div className="border border-gray-100 overflow-hidden">
                <img
                  src={`/events/event-${event.eventId}.png`}
                  alt={event.name}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
                {hasSubEvents && selectedDayIndex > 0
                  ? `Day ${selectedDayIndex} — About`
                  : "About this event"}
              </h2>
              <p className="text-gray-600 font-['Arian-light'] text-base leading-relaxed">
                {(hasSubEvents && selectedDayIndex > 0
                  ? event.subEvents![selectedDayIndex - 1].description
                  : event.description) ||
                  "Details for this event will be announced soon. Stay tuned for more information."}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date & Time */}
            <div className="border border-gray-100 p-5">
              <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
                Date & Time
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#CF78EC] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-['Arian-bold'] text-gray-900">
                    {activeEvent.dayOfWeek},{" "}
                    {new Date(displayDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#CF78EC] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-['Arian-light'] text-gray-600">
                    {new Date(displayDate).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Venue */}
            <div className="border border-gray-100 p-5">
              <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
                Venue
              </h3>
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#CF78EC] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-['Arian-bold'] text-gray-900">{displayVenue}</p>
                  <p className="text-xs font-['Arian-light'] text-gray-400 mt-0.5">
                    FEU Institute of Technology
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="border border-gray-100 p-5">
              <div>
                <p className="text-2xl font-['Arian-bold'] text-gray-900 leading-none">
                  {activeEvent._count.registrations}
                </p>
                <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1" />
                <p className="text-xs font-['Arian-light'] text-gray-400">Registered</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="border border-gray-100 p-5">
              <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
                Entry
              </h3>
              <p className="text-2xl font-['Arian-bold'] text-gray-900 leading-none">
                {getUserPrice(event, priceTier)}
              </p>
              <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1" />
              <p className="text-xs font-['Arian-light'] text-gray-400">
                {priceTier === "officer" ? "Officer Rate" : priceTier === "member" ? "Member Rate" : "Non-Member Rate"}
              </p>
            </div>

            {/* Semester Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-['Arian-bold'] text-[#CF78EC] border border-[#CF78EC] px-3 py-1 uppercase tracking-wider">
                {event.eventSemester} Semester
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    upcoming: { label: "Upcoming", classes: "border border-[#CF78EC] text-[#CF78EC]" },
    ongoing: { label: "Ongoing", classes: "bg-[#CF78EC] text-white" },
    finished: { label: "Finished", classes: "border border-gray-200 text-gray-400" },
  };
  const { label, classes } = config[status] ?? config.upcoming;
  return (
    <span className={`text-[10px] font-['Arian-bold'] uppercase tracking-widest px-2 py-0.5 ${classes}`}>
      {label}
    </span>
  );
}

function getUserPrice(event: EventWithCount, tier: "officer" | "member" | "nonmember"): string {
  const amount =
    tier === "officer" ? event.price :
    tier === "member" ? event.priceMember :
    event.priceNonMember;
  return amount === 0 ? "Free" : `₱${amount}`;
}

export default SelectedEvent;
