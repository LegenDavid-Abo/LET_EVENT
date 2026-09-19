import { notFound } from "next/navigation";
import { adminSupabase } from "@/lib/supabase";
import { hashToken } from "@/lib/security";
import QRCode from "qrcode";
import Link from "next/link";

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = adminSupabase();

  const { data: t } = await db.from("tickets").select("*, attendees(*), events(*)").eq("token_hash", hashToken(token)).single();
  if (!t) notFound();

  const event = t.events;
  const attendee = t.attendees;
  const qr = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_APP_URL}/ticket/${token}`, {
    width: 700,
    margin: 2,
    errorCorrectionLevel: "H"
  });

  return (
    <main className="field-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-bone/45">
          Evently
        </Link>

        <div className="ticket-notch mt-5 overflow-hidden rounded-[30px] bg-bone text-ink-950 shadow-premium">
          <div className="bg-brass-gradient p-7 text-ink-950">
            <div className="text-xs font-semibold tracking-[.25em] text-ink-950/50">DIGITAL TICKET</div>
            <h1 className="mt-3 text-3xl font-medium">{event.name}</h1>
            <p className="mt-2 text-ink-950/65">
              {event.event_date} — {event.start_time}
            </p>
          </div>

          <div className="ticket-perforation" />

          <div className="p-7">
            <p className="text-xs font-semibold tracking-widest text-ink-950/40">ATTENDEE</p>
            <h2 className="mt-1 text-2xl font-medium">{attendee.full_name}</h2>

            <div className="my-7 flex justify-center rounded-2xl border border-ink-950/8 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Ticket QR" className="h-56 w-56" />
            </div>

            <div className="space-y-3 border-t border-ink-950/10 pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-950/45">Ticket</span>
                <b>{t.ticket_number}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-950/45">Status</span>
                <b>{t.status}</b>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-bone/30">
          Present this QR code at the event entrance. Each ticket can be used once.
        </p>
      </div>
    </main>
  );
}
