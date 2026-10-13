-- Online booking. All availability rules live in the database so the website and the admin page cannot disagree.
create table public.booking_config (
  id int primary key default 1 check (id = 1),
  slot_minutes int not null default 30 check (slot_minutes between 10 and 240),
  advance_days int not null default 30 check (advance_days between 1 and 180),
  min_notice_hours int not null default 4 check (min_notice_hours between 0 and 168)
);
create table public.opening_hours (
  weekday int primary key check (weekday between 0 and 6),   -- 0 = Sunday ... 6 = Saturday
  is_open boolean not null default false,
  opens time not null default '09:00',
  closes time not null default '17:00',
  check (closes > opens)
);
create table public.blocked_dates (day date primary key, reason text check (reason is null or char_length(reason) <= 100));
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  email text check (email is null or char_length(email) <= 254),
  service text check (service is null or char_length(service) <= 100),
  notes text check (notes is null or char_length(notes) <= 500),
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index bookings_one_per_slot on public.bookings (slot_start) where status = 'confirmed';
create index bookings_start on public.bookings (slot_start);

alter table public.booking_config enable row level security;
alter table public.opening_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.bookings enable row level security;
create policy cfg_read on public.booking_config for select to anon, authenticated using (true);
create policy cfg_write on public.booking_config for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy hours_read on public.opening_hours for select to anon, authenticated using (true);
create policy hours_write on public.opening_hours for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy blocked_read on public.blocked_dates for select to anon, authenticated using (true);
create policy blocked_write on public.blocked_dates for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Visitors have NO direct access to bookings: they can only call the two functions below.
create policy bookings_admin on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Free time slots for one day (Kenya time). Exposes no personal data.
create or replace function public.open_slots(p_day date) returns table (slot_start timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  cfg public.booking_config%rowtype;
  oh public.opening_hours%rowtype;
  today date := (now() at time zone 'Africa/Nairobi')::date;
  m int; close_m int; s timestamptz;
begin
  select * into cfg from public.booking_config where id = 1;
  if not found then return; end if;
  if p_day < today or p_day > today + cfg.advance_days then return; end if;
  if exists (select 1 from public.blocked_dates b where b.day = p_day) then return; end if;
  select * into oh from public.opening_hours h where h.weekday = extract(dow from p_day)::int;
  if not found or not oh.is_open then return; end if;
  m := extract(hour from oh.opens)::int * 60 + extract(minute from oh.opens)::int;
  close_m := extract(hour from oh.closes)::int * 60 + extract(minute from oh.closes)::int;
  while m + cfg.slot_minutes <= close_m loop
    s := (p_day + make_interval(mins => m)) at time zone 'Africa/Nairobi';
    if s >= now() + make_interval(hours => cfg.min_notice_hours)
       and not exists (select 1 from public.bookings k where k.slot_start = s and k.status = 'confirmed') then
      slot_start := s;
      return next;
    end if;
    m := m + cfg.slot_minutes;
  end loop;
end $$;

-- Books a slot after re-checking every rule. The error messages are written for visitors.
create or replace function public.book_slot(p_name text, p_phone text, p_email text, p_service text, p_start timestamptz, p_notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cfg public.booking_config%rowtype; v_id uuid; v_phone text := trim(coalesce(p_phone, ''));
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(v_phone) < 7 then
    raise exception 'Please enter your name and phone number.';
  end if;
  select * into cfg from public.booking_config where id = 1;
  if not found then raise exception 'Online booking is not available right now.'; end if;
  if not exists (select 1 from public.open_slots((p_start at time zone 'Africa/Nairobi')::date) o where o.slot_start = p_start) then
    raise exception 'That time is no longer available. Please pick another.';
  end if;
  if (select count(*) from public.bookings where phone = v_phone and status = 'confirmed' and slot_start > now()) >= 3 then
    raise exception 'You already have several upcoming bookings. Please call us to change them.';
  end if;
  insert into public.bookings (name, phone, email, service, notes, slot_start, slot_end)
  values (trim(p_name), v_phone, nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_service, '')), ''),
          nullif(trim(coalesce(p_notes, '')), ''), p_start, p_start + make_interval(mins => cfg.slot_minutes))
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'That time was just taken. Please pick another.';
end $$;

grant execute on function public.open_slots(date) to anon, authenticated;
grant execute on function public.book_slot(text, text, text, text, timestamptz, text) to anon, authenticated;

insert into public.booking_config (id) values (1);
insert into public.opening_hours (weekday, is_open) values (0, false), (1, true), (2, true), (3, true), (4, true), (5, true), (6, false);
