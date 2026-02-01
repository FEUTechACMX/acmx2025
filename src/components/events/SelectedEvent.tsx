import { EventWithCount } from "@/types/events";
import AttendButton from "./AttendButton";

interface SelectedEventProps {
  event: EventWithCount;
}

const SelectedEvent = ({ event }: SelectedEventProps) => {
  return (
    <div className="min-h-screen bg-event-surface flex column items-center">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg">
              <div className="p-6">
                <h1 className="text-4xl font-['Fjalla-One'] font-normal my-2">
                  {event.name}
                </h1>
                <h5 className="text-xl">Hosted by ACM</h5>
              </div>
              <div className="px-6">
                <h2 className="text-3xl font-normal font-['Fjalla-One']  my-2">
                  Details
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description +
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin velit ligula, euismod in malesuada in, egestas sit amet tortor. Integer imperdiet dapibus lacinia. Morbi consequat elementum enim, vel tincidunt ligula euismod sed. Morbi mollis massa dolor, non imperdiet orci tincidunt non. Nullam nec semper quam, sed pellentesque ligula."}
                </p>
              </div>
              <div className="p-6">
                <AttendButton eventId={event.eventId} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Info */}
            <div className="relative rounded-lg border border-event-border  flex flex-col justify-center  bg-white text-black">
              <img
                src={`/events/event-${event.eventId}.png`}
                alt={event.name}
                className="object-cover w-120 h-full"
              />
            </div>
            <div className="bg-white rounded-lg border w-120 h-50 gap-12 flex justify-start flex-row border-event-border p-6">
              <div className="text-2xl text-muted-foreground   flex flex-col justify-between uppercase tracking-wide">
                <span>
                  <h3>
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <h3>
                    {new Date(event.startDate).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </h3>
                </span>
                <div className="text-xl  ">
                  <p> {event.price === 0 ? "FREE" : `$${event.price}`}</p>
                </div>
              </div>
              <div className="flex flex-col h-full uppercase justify-between text-sm text-foreground">
                <span className="gap-3 flex flex-col max-w-42">
                  <p>FEU TECH Institute of Technology</p>
                  <p>{event.name}</p>
                </span>
                <p className="font-medium text-foreground">{event.venue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedEvent;
