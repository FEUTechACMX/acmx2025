// app/events/[eventId]/page.tsx
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events";
import SelectedEvent from "@/components/events/SelectedEvent";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  return <SelectedEvent event={event} />;
}
