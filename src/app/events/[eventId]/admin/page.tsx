// app/events/[eventId]/admin/page.tsx
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events";
import AdminDaySelector from "@/components/events/AdminDaySelector";
import Link from "next/link";

export default async function AdminEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  // Serialize dates for the client component
  const serializedEvent = {
    eventId: event.eventId,
    name: event.name,
    subEvents: (event.subEvents || []).map((sub) => ({
      eventId: sub.eventId,
      name: sub.name,
      startDate: new Date(sub.startDate).toISOString(),
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm font-['Arian-light'] text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Event
        </Link>

        <div className="mt-6">
          <p className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest mb-2">
            Admin Panel
          </p>
          <h1 className="text-3xl sm:text-4xl font-['Fjalla-One'] text-gray-900 leading-none">
            {event.name}
          </h1>
        </div>

        <div className="mt-8 pb-20">
          <AdminDaySelector event={serializedEvent} />
        </div>
      </div>
    </div>
  );
}
