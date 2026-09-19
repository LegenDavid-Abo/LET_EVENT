import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, ArrowLeft } from "lucide-react";
import { adminSupabase } from "@/lib/supabase";
import Countdown from "@/components/Countdown";
import RegistrationForm from "@/components/RegistrationForm";
import LiveMap from "@/components/LiveMap";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = adminSupabase();

  const { data: event } = await db.from("events").select("*").eq("slug", slug).eq("is_published", true).single();
  if (!event) notFound();

  const { data: fields } = await db
    .from("registration_fields")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  const start = `${event.event_date}T${event.start_time}`;
  const hasLocation = Boolean(event.venue_name || event.venue_address);

  return (
    <main className="min-h-screen">
      <header className="relative min-h-[72vh] overflow-hidden">
        {event.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_url} className="absolute inset-0 h-full w-full object-cover opacity-50" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-black/20" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-6 py-14">
          <Link href="/" className="absolute left-6 top-8 flex items-center gap-2 text-sm text-bone/60">
            <ArrowLeft size={16} /> Evently
          </Link>
          <div className="max-w-4xl">
            <div className="brass-rule mb-6 w-16" />
            <h1 className="text-5xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-8xl">{event.name}</h1>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="glass rounded-full px-4 py-2">
                <CalendarDays className="mr-2 inline" size={15} />
                {event.event_date}
              </span>
              <span className="glass rounded-full px-4 py-2">
                <Clock className="mr-2 inline" size={15} />
                {event.start_time}
              </span>
              {hasLocation && (
                <span className="glass rounded-full px-4 py-2">
                  <MapPin className="mr-2 inline" size={15} />
                  {event.venue_name || event.venue_address}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-sm font-medium text-bone/40">Starts in</p>
            <div className="mt-4">
              <Countdown target={start} />
            </div>

            {event.description && (
              <>
                <h2 className="mt-16 text-3xl font-medium">About the event</h2>
                <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-bone/55">{event.description}</p>
              </>
            )}

            {event.instructions && (
              <>
                <h2 className="mt-12 text-3xl font-medium">Good to know</h2>
                <p className="mt-4 whitespace-pre-wrap leading-8 text-bone/55">{event.instructions}</p>
              </>
            )}

            {hasLocation && (
              <>
                <h2 className="mt-12 text-3xl font-medium">Location</h2>
                <p className="mt-3 text-bone/55">{event.venue_name}</p>
                <p className="text-bone/40">{event.venue_address}</p>
                <div className="mt-5">
                  <LiveMap address={event.venue_address} venueName={event.venue_name} height={340} />
                </div>
              </>
            )}
          </div>

          <div id="register" className="glass h-fit rounded-3xl p-6 sm:p-8">
            <div className="mb-7">
              <h2 className="text-3xl font-medium">Reserve your place</h2>
              <p className="mt-2 text-sm text-bone/45">
                Up to {event.max_tickets_per_registration} ticket{event.max_tickets_per_registration > 1 ? "s" : ""}{" "}
                per registration.
              </p>
            </div>
            <RegistrationForm slug={event.slug} max={event.max_tickets_per_registration} fields={fields || []} />
          </div>
        </div>
      </section>
    </main>
  );
}
