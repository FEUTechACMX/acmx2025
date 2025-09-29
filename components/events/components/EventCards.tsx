import React from "react";
import Link from "next/link";

// interface Event {
//   eventId: string;
//   name: string;
//   description: string;
//   venue: string;
//   startDate: string;
//   dayOfWeek: string;
//   Price: string;
//   endDate: string;
//   createdAt: string;
//   updatedAt: string;
// }

export default function EventCards() {
  return (
    <Link href="/events/title" passHref>
      <div className="w-[537px] h-[657px] flex flex-col justify-between cursor-pointer hover:opacity-90 transition">
        <div className="w-full h-[45%] flex items-center justify-center bg-emerald-700 rounded-lg">
          This is where the image would be
        </div>
        <div className="w-full h-[55%] flex flex-col justify-between text-black">
          <h1 className="font-['Fjalla-One'] text-[64px] "> Event Title</h1>
          <p className="font-['Fjalla-One'] text-[32px]">Hosted by: ACM</p>
          <div className="w-full flex justify-between align-left">
            <p>Weekday</p>
            <p>Date</p>
            <p>Time</p>
          </div>
          <div className="w-full flex justify-between align-left">
            <p>30 people going</p>
            <p>30 pesos</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
