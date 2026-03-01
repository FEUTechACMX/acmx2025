import { EventWithCount } from "@/types/events";
import AttendButton from "./AttendButton";
import Link from "next/link";

interface SelectedEventProps {
  event: EventWithCount;
}

const SelectedEvent = ({ event }: SelectedEventProps) => {
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
            <p className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest mb-2">
              ACM Event
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-['Fjalla-One'] text-gray-900 leading-none">
              {event.name}
            </h1>
            <p className="text-gray-400 font-['Arian-light'] text-sm mt-3">
              Hosted by ACM · FEU Tech
            </p>
          </div>

          <div className="shrink-0">
            <AttendButton eventId={event.eventId} />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-100 mt-8" />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          {/* Main — Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="border border-gray-100 overflow-hidden">
              <img
                src={`/events/event-${event.eventId}.png`}
                alt={event.name}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
                About this event
              </h2>
              <p className="text-gray-600 font-['Arian-light'] text-base leading-relaxed">
                {event.description || "Details for this event will be announced soon. Stay tuned for more information."}
              </p>
            </div>
          </div>

          {/* Sidebar — Event Info */}
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
                  <div>
                    <p className="text-sm font-['Arian-bold'] text-gray-900">
                      {event.dayOfWeek},{" "}
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#CF78EC] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-['Arian-light'] text-gray-600">
                    {new Date(event.startDate).toLocaleTimeString("en-US", {
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
                  <p className="text-sm font-['Arian-bold'] text-gray-900">{event.venue}</p>
                  <p className="text-xs font-['Arian-light'] text-gray-400 mt-0.5">
                    FEU Institute of Technology
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="border border-gray-100 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-['Arian-bold'] text-gray-900 leading-none">
                    {event._count.registrations}
                  </p>
                  <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1" />
                  <p className="text-xs font-['Arian-light'] text-gray-400">Registered</p>
                </div>
                <div>
                  <p className="text-2xl font-['Arian-bold'] text-gray-900 leading-none">
                    {event.price === 0 ? "Free" : `₱${event.price}`}
                  </p>
                  <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1" />
                  <p className="text-xs font-['Arian-light'] text-gray-400">Entry</p>
                </div>
              </div>
            </div>

            {/* Semester Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-['Arian-bold'] text-[#CF78EC] border border-[#CF78EC] px-3 py-1 uppercase tracking-wider">
                {event.eventSemester} Semester
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedEvent;
