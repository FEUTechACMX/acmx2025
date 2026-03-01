import React from "react";
import Link from "next/link";
import type { EventWithCount } from "@/types/events";

interface EventCardProps {
  event: EventWithCount;
}

export default function EventCards({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.eventId}`} passHref>
      <div className="w-full aspect-[409/578] bg-white relative text-black overflow-hidden border border-[#CD78EC] group hover:border-[#CF78EC] transition-colors">
        {/* Card Design */}
        <div className="absolute top-0 right-0 h-[76%] w-[77%]">
          <img className="h-full w-full object-cover" src="/eventCard/cardBG.png" alt="cardImage" />
        </div>

        {/* Semester Info */}
        <div className="headers font-['Montserrat'] text-[clamp(8px,2.5vw,12px)] sm:text-[12px] absolute rotate-270 text-right w-[123px] origin-top-left h-[36px] left-[7%] top-[26.5%]">
          <p className="m-0">{event.eventSemester} SEMESTER</p>
          <p className="m-0 -mt-1 font-bold">ACM EVENT SERIES</p>
        </div>

        {/* Title */}
        <div className="absolute left-[7%] right-[7%] bottom-[24.4%] font-['Roller-Coaster']">
          <p className="text-[clamp(20px,6vw,32px)] sm:text-[32px] leading-tight">ACM</p>
          <h1 className="text-[clamp(36px,12vw,66px)] sm:text-[66px] leading-none">{event.name}</h1>
        </div>

        {/* Venue + Schedule */}
        <div className="absolute left-[7%] right-[7%] bottom-[13%] font-['Trochut'] text-[clamp(10px,3vw,16px)] sm:text-[16px] gap-0">
          <p className="m-0">Where: {event.venue}</p>
          <p className="-mt-1">
            {event.dayOfWeek},{" "}
            {new Date(event.startDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-[5.2%] right-[7%] left-[7%] font-['Montserrat'] text-[clamp(7px,2vw,10px)] sm:text-[10px] flex justify-between">
          <p>{event._count.registrations} People Going</p>
          <p>{event.price === 0 ? "Free" : `₱${event.price}`}</p>
        </div>
      </div>
    </Link>
  );
}
