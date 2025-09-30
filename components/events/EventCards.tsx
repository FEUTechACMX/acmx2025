import React from "react";
import Link from "next/link";

interface Event {
  eventId: string;
  name: string;
  semester: string;
  venue: string;
  startDate: string;
  dayOfWeek: string;
  price: string;
  endDate: string;
  registrant: number;
}

const event: Event = {
  eventId: "sampleID",
  name: "EVENT TITLE",
  semester: "1st",
  venue: "FEU Tech Student's Plaza",
  startDate: "September 30 | 7:00PM",
  dayOfWeek: "Wed",
  price: "Free",
  endDate: "September 30 | 9:00PM",
  registrant: 30,
};

export default function EventCards() {
  return (
    <Link href="/events/title" passHref>
      <div className="w-[409px] h-[578px] bg-[white] relative text-black overflow-hidden">
        <div className="headers font-['Montserrat'] text-[12px] absolute rotate-270 text-right w-[123px] origin-top-left h-[36px] left-[30px] top-[153px]">
          {/* What Semester */}
          <p className="m-0">{event.semester} Semester</p>
          <p className="m-0 -mt-1 font-bold">ACM Event Series</p>
        </div>
        <div className="left-[29px] right-[29px] bottom-[141px] Title font-['Roller-Coaster'] absolute">
          {/* ACM + Event Title */}
          <p className="text-[43px] h-[33px]">ACM</p>
          <h1 className="text-[86px] h-[66px]">{event.name}</h1>
        </div>
        <div className="eventDetails absolute left-[29px] right-[29px] bottom-[75px] font-['Trochut'] text-[16px] gap-0">
          {/* Venue + Schedule */}
          <p className="m-0">Where: {event.venue}</p>
          <p className="-mt-1">
            {event.dayOfWeek}, {event.startDate}
          </p>
        </div>
        <div className="absolute bottom-[30px] right-[29px] left-[29px] footer font-['Montserrat'] text-[10px] flex justify-between">
          {/* Number of People Going + Price of Event */}
          <p>{event.registrant} People Going</p>
          <p>{event.price}</p>
        </div>
      </div>
    </Link>
  );
}
