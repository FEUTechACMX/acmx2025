// app/events/[eventId]/page.tsx
import { notFound } from "next/navigation";
import { getEventById } from "../../../../lib/events";
import SelectedEvent from "../../../../components/events/SelectedEvent";

export default async function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await getEventById(params.eventId);

  if (!event) {
    notFound();
  }

  return <SelectedEvent event={event} />;
}
