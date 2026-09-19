import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSupabase } from "@/lib/supabase";
import { newToken, hashToken } from "@/lib/security";
import { qrDataUrl } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/brevo";

const schema = z.object({
  slug: z.string(),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ticket_quantity: z.number().int().min(1),
  custom_fields: z.record(z.any()).optional()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const db = adminSupabase();

    const { data: event, error: eventError } = await db
      .from("events")
      .select("*")
      .eq("slug", body.slug)
      .eq("is_published", true)
      .single();
    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (body.ticket_quantity > event.max_tickets_per_registration) {
      return NextResponse.json({ error: "Ticket limit exceeded for this event" }, { status: 400 });
    }

    const now = new Date();
    if (event.registration_open_at && now < new Date(event.registration_open_at)) {
      return NextResponse.json({ error: "Registration has not opened yet" }, { status: 400 });
    }
    if (event.registration_close_at && now > new Date(event.registration_close_at)) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
    }

    if (event.max_attendees) {
      const { count } = await db
        .from("attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);
      if ((count || 0) + body.ticket_quantity > event.max_attendees) {
        return NextResponse.json({ error: "Registration capacity reached" }, { status: 400 });
      }
    }

    // An email may register once per event — but is free to register again
    // for a different event.
    const { count: existingForEvent } = await db
      .from("attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .ilike("email", body.email);
    if ((existingForEvent || 0) > 0) {
      return NextResponse.json(
        { error: "This email has already been used to register for this event." },
        { status: 409 }
      );
    }

    const registrationId = `REG-${newToken().slice(0, 8).toUpperCase()}`;
    const { data: attendee, error: attendeeError } = await db
      .from("attendees")
      .insert({
        event_id: event.id,
        registration_id: registrationId,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        custom_fields: body.custom_fields || {},
        ticket_quantity: body.ticket_quantity
      })
      .select()
      .single();
    if (attendeeError) throw attendeeError;

    try {
      let firstTicketUrl = "";

      for (let i = 1; i <= body.ticket_quantity; i++) {
        const token = newToken();
        const ticketNumber = `${event.slug.slice(0, 8).toUpperCase()}-${newToken().slice(0, 5).toUpperCase()}`;

        const { data: ticket, error: ticketError } = await db
          .from("tickets")
          .insert({
            event_id: event.id,
            attendee_id: attendee.id,
            token_hash: hashToken(token),
            ticket_number: ticketNumber
          })
          .select()
          .single();
        if (ticketError) throw ticketError;

        const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${token}`;
        if (!firstTicketUrl) firstTicketUrl = ticketUrl;

        await sendTicketEmail({
          to: body.email,
          name: body.full_name,
          eventName: event.name,
          date: event.event_date,
          venue: event.venue_name || event.venue_address || "",
          ticketUrl,
          qrDataUrl: await qrDataUrl(ticketUrl),
          ticketNumber
        });
      }

      return NextResponse.json({ registration_id: registrationId, ticket_url: firstTicketUrl });
    } catch (issueError) {
      // Ticket issuance or email delivery failed partway through — remove
      // the attendee (tickets cascade) so the person can safely retry
      // without hitting the duplicate-email guard.
      await db.from("attendees").delete().eq("id", attendee.id);
      throw issueError;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 400 });
  }
}
