-- Evently schema
-- Run this once in the Supabase SQL editor on a fresh project.

create extension if not exists pgcrypto;

create type ticket_status as enum ('UNUSED','USED','REVOKED');
create type registration_field_type as enum ('text','email','phone','textarea','select','checkbox');

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  cover_url text,
  venue_name text,
  venue_address text,
  event_date date not null,
  start_time time not null,
  end_time time,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  max_attendees integer,
  max_tickets_per_registration integer not null default 1 check (max_tickets_per_registration > 0),
  is_published boolean not null default false,
  instructions text,
  created_at timestamptz not null default now()
);
-- Note: the venue's live map is generated from venue_name / venue_address at
-- render time, so there is no separate map_url column to maintain.

create table if not exists registration_fields (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  field_key text not null,
  field_type registration_field_type not null default 'text',
  required boolean not null default false,
  options jsonb,
  sort_order integer not null default 0
);

create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  registration_id text not null unique,
  full_name text not null,
  email text not null,
  phone text,
  address text,
  custom_fields jsonb not null default '{}'::jsonb,
  ticket_quantity integer not null check (ticket_quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  token_hash text not null unique,
  ticket_number text not null unique,
  status ticket_status not null default 'UNUSED',
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  staff_user_id uuid references auth.users(id) on delete set null,
  scanned_at timestamptz not null default now(),
  result text not null
);

alter table events enable row level security;
alter table registration_fields enable row level security;
alter table attendees enable row level security;
alter table tickets enable row level security;
alter table check_ins enable row level security;

-- Public (anonymous) visitors can read published events and their fields.
create policy "published events are public" on events for select using (is_published = true);
create policy "public registration fields" on registration_fields for select using (
  exists(select 1 from events e where e.id = event_id and e.is_published = true)
);

-- Any signed-in admin can create, read, update and delete events and their
-- registration fields from the admin dashboard. Attendees, tickets and
-- check-ins are only ever written through the API routes with the service
-- role key, so no client-side policy is needed for those tables.
create policy "admins manage events" on events for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "admins manage registration fields" on registration_fields for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Read-only access so the admin dashboard can show registration/ticket
-- counts. Writes to these tables still only ever happen through the API
-- routes with the service role key.
create policy "admins read attendees" on attendees for select using (auth.uid() is not null);
create policy "admins read tickets" on tickets for select using (auth.uid() is not null);

create or replace function consume_ticket(p_hash text, p_staff uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t tickets%rowtype;
begin
  update tickets
  set status='USED', checked_in_at=now(), checked_in_by=p_staff
  where token_hash=p_hash and status='UNUSED'
  returning * into t;

  if found then
    insert into check_ins(ticket_id,staff_user_id,result) values(t.id,p_staff,'APPROVED');
    return jsonb_build_object('result','VALID','ticket_id',t.id,'ticket_number',t.ticket_number,'checked_in_at',t.checked_in_at);
  end if;

  select * into t from tickets where token_hash=p_hash;
  if not found then return jsonb_build_object('result','INVALID'); end if;
  if t.status='USED' then
    insert into check_ins(ticket_id,staff_user_id,result) values(t.id,p_staff,'ALREADY_USED');
    return jsonb_build_object('result','USED','ticket_number',t.ticket_number,'checked_in_at',t.checked_in_at);
  end if;
  if t.status='REVOKED' then
    insert into check_ins(ticket_id,staff_user_id,result) values(t.id,p_staff,'REVOKED');
    return jsonb_build_object('result','REVOKED','ticket_number',t.ticket_number);
  end if;
  return jsonb_build_object('result','INVALID');
end $$;
grant execute on function consume_ticket(text,uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Storage: cover images uploaded from the device in the admin form
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "covers are publicly readable" on storage.objects for select
  using (bucket_id = 'covers');

create policy "admins upload covers" on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);

create policy "admins replace covers" on storage.objects for update
  using (bucket_id = 'covers' and auth.uid() is not null);

create policy "admins delete covers" on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid() is not null);
