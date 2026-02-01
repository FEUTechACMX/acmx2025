import React from "react";
import Link from "next/link";
import type { EventWithCount } from "@/types/events";

interface EventCardProps {
  event: EventWithCount;
}

export default function EventCards({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.eventId}`} passHref>
      <div className="w-[409px] h-[578px] bg-white relative text-black overflow-hidden border border-[#CD78EC] rounded">
        {/* Card Design */}
        <div className="absolute h-[438px] w-[315px] right-0">
          <img className="h-full w-full" src="/eventCard/cardBG.png" alt="cardImage" />
        </div>

        {/* Semester Info */}
        <div className="headers font-['Montserrat'] text-[12px] absolute rotate-270 text-right w-[123px] origin-top-left h-[36px] left-[30px] top-[153px]">
          <p className="m-0">{event.eventSemester} SEMESTER</p>
          <p className="m-0 -mt-1 font-bold">ACM EVENT SERIES</p>
        </div>

        {/* Title */}
        <div className="left-[29px] right-[29px] bottom-[141px] Title font-['Roller-Coaster'] absolute">
          <p className="text-[32px] h-[33px]">ACM</p>
          <h1 className="text-[66px] h-[66px]">{event.name}</h1>
        </div>

        {/* Venue + Schedule */}
        <div className="eventDetails absolute left-[29px] right-[29px] bottom-[75px] font-['Trochut'] text-[16px] gap-0">
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
        <div className="absolute bottom-[30px] right-[29px] left-[29px] footer font-['Montserrat'] text-[10px] flex justify-between">
          <p>{event._count.registrations} People Going</p>
          <p>{event.price === 0 ? "Free" : `$${event.price}`}</p>
        </div>
      </div>
    </Link>
  );
}
