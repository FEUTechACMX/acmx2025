import React from "react";
import Link from "next/link";
import type { EventWithCount } from "@/types/events";
import { getEventStatus } from "@/types/events";

interface EventCardProps {
  event: EventWithCount;
  priceTier: "officer" | "member" | "nonmember";
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  finished: "Finished",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-[#E4BCF3] text-[#7c3aed]",
  ongoing: "bg-[#CF78EC] text-white",
  finished: "bg-gray-100 text-gray-400",
};

function getPrice(event: EventWithCount, tier: "officer" | "member" | "nonmember"): string {
  const amount =
    tier === "officer" ? event.price :
    tier === "member" ? event.priceMember :
    event.priceNonMember;
  return amount === 0 ? "Free" : `₱${amount}`;
}

export default function EventCards({ event, priceTier }: EventCardProps) {
  const status = getEventStatus(event);

  return (
    <Link href={`/events/${event.eventId}`} passHref>
      <div className="w-full aspect-[409/578] bg-white relative text-black overflow-hidden border border-[#CD78EC] group hover:border-[#CF78EC] transition-colors">
        {/* Card Design */}
        <div className="absolute top-0 right-0 h-[76%] w-[77%]">
          <img className="h-full w-full object-cover" src="/eventCard/cardBG.png" alt="cardImage" />
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`text-[10px] font-['Arian-bold'] uppercase tracking-widest px-2 py-0.5 ${STATUS_COLORS[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          {event.isMultiDay && (
            <span className="ml-1 text-[10px] font-['Arian-bold'] uppercase tracking-widest px-2 py-0.5 bg-gray-900 text-white">
              Multi-Day
            </span>
          )}
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
          <p>{getPrice(event, priceTier)}</p>
        </div>
      </div>
    </Link>
  );
}
