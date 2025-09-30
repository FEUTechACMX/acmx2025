// components/events/SelectedEvent.tsx
import { EventWithCount } from "../../types/events"; // <-- type we defined earlier

interface SelectedEventProps {
  event: EventWithCount;
}

const SelectedEvent = ({ event }: SelectedEventProps) => {
  return (
    <div className="min-h-screen bg-event-surface flex items-center">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-event-hero to-event-hero-dark rounded-xl overflow-hidden h-64 md:h-80">
              <div className="relative h-full flex flex-col justify-center px-6 md:px-12 bg-white text-black">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  "This is a Placeholder for an Image"
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-lg border border-event-border">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Details</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Info Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-event-border">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  {event.dayOfWeek}, {new Date(event.startDate).toDateString()}{" "}
                  · {new Date(event.startDate).toLocaleTimeString("en-US")}
                </div>
                <div className="font-semibold text-foreground">
                  {event.name}
                </div>
              </div>
              <div className="text-2xl font-bold text-event-hero">
                {event.price === 0 ? "FREE" : `$${event.price}`}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Info */}
            <div className="bg-white rounded-lg border border-event-border">
              <div className="p-6">
                <h3 className="font-semibold text-foreground">Hosted by ACM</h3>
                <p className="text-sm text-muted-foreground">
                  {event._count?.registrations ?? 0} people registered
                </p>
              </div>
            </div>

            {/* Time & Location */}
            <div className="bg-white rounded-lg border border-event-border p-6">
              <p className="font-medium text-foreground">{event.venue}</p>
              <p className="text-sm text-muted-foreground">
                {event.dayOfWeek},{" "}
                {new Date(event.startDate).toLocaleDateString("en-US")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md">
                Share
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md">
                Attend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedEvent;
