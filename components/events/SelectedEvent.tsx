interface Event {
  eventId: string;
  eventName: string;
  description: string;
  venue: string;
  weekDay: string;
  date: string;
  time: string;
  host: string;
  participants: number;
}

const event: Event = {
  eventId: "E001",
  eventName: "Tech Conference",
  description:
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga, earum ullam temporibus, sunt eos autem, obcaecati veritatis dolores sapiente inventore quibusdam. Sed praesentium asperiores tempore!",
  venue: "Feu Tech",
  weekDay: "Tuesday",
  date: "September 30",
  time: "12.30PM",
  host: "ACM",
  participants: 30,
};

const SelectedEvent = () => {
  return (
    <div className="min-h-screen bg-event-surface flex items-center">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-event-hero to-event-hero-dark rounded-xl overflow-hidden h-64 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-event-hero/90 to-event-hero-dark/90">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-10 right-10 w-32 h-32 bg-event-accent rounded-full blur-xl"></div>
                  <div className="absolute bottom-10 left-10 w-48 h-48 bg-event-hero-dark rounded-full blur-xl"></div>
                </div>
              </div>
              <div className="relative h-full flex flex-col justify-center px-6 md:px-12 bg-white text-black">
                This is a Placeholder for an Image
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
                  {event.weekDay.toUpperCase()}, {event.date.toUpperCase()} ·{" "}
                  {event.time} PHT
                </div>
                <div className="font-semibold text-foreground">
                  {event.eventName}
                </div>
              </div>
              <div className="text-2xl font-bold text-event-hero">FREE</div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Group Info */}
            <div className="bg-white rounded-lg border border-event-border">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-event-hero rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {event.host}
                    </h3>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= 4
                                ? "fill-event-rating text-event-rating"
                                : "fill-gray-300 text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium ml-1">4.8</span>
                      <span className="text-sm text-muted-foreground underline ml-1">
                        {event.participants} ratings
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Time & Location */}
            <div className="bg-white rounded-lg border border-event-border">
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-muted-foreground mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                  <div>
                    <div className="font-medium text-foreground">
                      {event.weekDay}, {event.date}, 2025
                    </div>
                    <div className="text-sm text-muted-foreground">
                      6:00 PM to 9:00 PM PHT
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-muted-foreground mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <div className="font-medium text-foreground">
                      Ascendion Philippines
                    </div>
                    <div className="text-sm text-muted-foreground">
                      10F Ayala North Exchange Tower 2,
                      <br />
                      Ayala Ave, Makati City · Makati City
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-lg border border-event-border">
              <div className="p-0">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-purple-200/30"></div>
                  <div className="relative text-center">
                    <svg
                      className="w-8 h-8 text-primary mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div className="text-sm text-muted-foreground">
                      Map View
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16,6 12,2 8,6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                Share
              </button>
              <button className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
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
