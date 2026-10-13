-- Secure document upload. Files go to a PRIVATE bucket; only admins can read them. Visitors can only
-- upload into a submission they just created (30-minute window, 5 files, 10 MB each, listed file types).
create table public.document_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  email text check (email is null or char_length(email) <= 254),
  topic text check (topic is null or char_length(topic) <= 100),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'uploading' check (status in ('uploading', 'new', 'reviewed')),
  files jsonb not null default '[]'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index document_submissions_created on public.document_submissions (created_at desc);
alter table public.document_submissions enable row level security;
create policy docs_admin on public.document_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-documents', 'client-documents', false, 10485760, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.create_submission(p_name text, p_phone text, p_email text, p_topic text, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_hdr json; v_ip text; v_hash text; v_id uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(trim(coalesce(p_phone, ''))) < 7 then
    raise exception 'Please enter your name and phone number.';
  end if;
  begin v_hdr := nullif(current_setting('request.headers', true), '')::json; exception when others then v_hdr := null; end;
  v_ip := trim(split_part(coalesce(v_hdr ->> 'x-forwarded-for', ''), ',', 1));
  v_hash := case when v_ip = '' then null else md5(v_ip) end;
  if v_hash is not null and (select count(*) from public.document_submissions where ip_hash = v_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many uploads from your connection. Please try again later or contact us.';
  end if;
  insert into public.document_submissions (name, phone, email, topic, note, ip_hash)
  values (trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_topic, '')), ''), nullif(trim(coalesce(p_note, '')), ''), v_hash)
  returning id into v_id;
  return v_id;
end $$;

-- Used by the storage policy: is this object path allowed for an anonymous upload right now?
create or replace function public.upload_allowed(p_name text) returns boolean
language plpgsql stable security definer set search_path = public, storage as $$
declare v_id uuid;
begin
  if p_name !~ '^[0-9a-f-]{36}/[0-4]-[A-Za-z0-9._-]{1,80}$' then return false; end if;
  begin v_id := split_part(p_name, '/', 1)::uuid; exception when others then return false; end;
  return exists (select 1 from public.document_submissions s where s.id = v_id and s.status = 'uploading' and s.created_at > now() - interval '30 minutes')
     and (select count(*) from storage.objects o where o.bucket_id = 'client-documents' and o.name like (v_id::text || '/%')) < 5;
end $$;

-- Closes the submission and records what actually arrived (read from storage, not trusted from the browser).
create or replace function public.finish_submission(p_id uuid) returns int
language plpgsql security definer set search_path = public, storage as $$
declare v_files jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('path', o.name, 'size', (o.metadata ->> 'size')::bigint, 'type', o.metadata ->> 'mimetype') order by o.name), '[]'::jsonb)
  into v_files from storage.objects o where o.bucket_id = 'client-documents' and o.name like (p_id::text || '/%');
  if jsonb_array_length(v_files) = 0 then raise exception 'No files were received. Please try again.'; end if;
  update public.document_submissions set status = 'new', files = v_files
  where id = p_id and status = 'uploading' and created_at > now() - interval '30 minutes';
  if not found then raise exception 'This upload has expired. Please start again.'; end if;
  return jsonb_array_length(v_files);
end $$;

grant execute on function public.create_submission(text, text, text, text, text) to anon, authenticated;
grant execute on function public.finish_submission(uuid) to anon, authenticated;
grant execute on function public.upload_allowed(text) to anon, authenticated;

create policy "docs visitor upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'client-documents' and public.upload_allowed(name));
create policy "docs admin read" on storage.objects for select to authenticated
  using (bucket_id = 'client-documents' and public.is_admin());
create policy "docs admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_admin());
