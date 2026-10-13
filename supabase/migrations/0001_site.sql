-- Dan Company website: content, enquiries and admin access. Run in a NEW Supabase project.
create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where id = auth.uid() and is_active)
$$;

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Dan Company',
  city text not null default 'Eldoret CBD',
  tagline text,
  phone_display text, phone_tel text, whatsapp text, email text, address text, hours text, about text,
  updated_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null, answer text not null,
  sort_order int not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text check (phone is null or char_length(phone) <= 30),
  email text check (email is null or char_length(email) <= 254),
  service text check (service is null or char_length(service) <= 100),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);
create index enquiries_created on public.enquiries (created_at desc);

alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.faqs enable row level security;
alter table public.enquiries enable row level security;

create policy admin_self on public.admin_profiles for select to authenticated using (id = auth.uid());
create policy settings_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_write on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy services_read on public.services for select to anon, authenticated using (is_published or public.is_admin());
create policy services_write on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy faqs_read on public.faqs for select to anon, authenticated using (is_published or public.is_admin());
create policy faqs_write on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Visitors may submit an enquiry (status must be 'new'); only admins can read or manage them.
create policy enquiries_submit on public.enquiries for insert to anon, authenticated with check (status = 'new');
create policy enquiries_admin on public.enquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (id, tagline, phone_display, email, address, hours, about) values (
  1, 'KRA and tax services, close to you in Eldoret CBD.', '[Phone number]', '[Email address]',
  '[Building and floor], Eldoret CBD, Eldoret', '[Opening hours]',
  E'Dan Company is a tax services office in Eldoret CBD. We help individuals and businesses in Eldoret and across Uasin Gishu deal with KRA and keep their paperwork in order.\n[Add a short story here: who runs the office, how long you have worked in tax, and any qualifications you can state.]');
insert into public.services (title, description, sort_order) values
  ('KRA PIN registration', 'Get a PIN for yourself or your business, and update your details when they change.', 1),
  ('Income tax returns', 'Annual returns for employees, sole traders and companies, including nil returns.', 2),
  ('VAT, PAYE and withholding tax', 'Monthly returns prepared from your records and filed on iTax.', 3),
  ('eTIMS e-invoicing', 'Set up, and learn to issue invoices that meet KRA''s electronic invoicing rules.', 4),
  ('Tax Compliance Certificate', 'Find out what is outstanding, then apply for your certificate.', 5),
  ('Records and KRA notices', 'Keep receipts and books in order, and bring us any notice you receive from KRA.', 6);
insert into public.faqs (question, answer, sort_order) values
  ('Do I need a KRA PIN?', 'Most people who earn income, run a business or deal with employers, banks, land or vehicle transactions need one. Tell us your situation and we will confirm.', 1),
  ('What if I earned nothing this year?', 'If you already have a PIN with an income tax obligation, you generally still need to file a nil return. We can check your obligations for you.', 2),
  ('What if I have missed a deadline?', 'Late filing can attract penalties and interest, and the amount can grow, so it is best to act early. Bring what you have and we will work out where you stand.', 3),
  ('Will you file without my approval?', 'No. You check everything before it is submitted, and you keep a copy of each acknowledgement.', 4),
  ('I received a notice from KRA. What now?', 'Bring the notice and your records for the period it mentions. We will go through it with you.', 5),
  ('How much do you charge?', '[Add your fee approach here, for example a fixed fee per return, or ask us for a quote.]', 6);
