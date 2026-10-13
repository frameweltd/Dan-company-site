# Dan Company website (Phase W1: public site + enquiries + admin)

Next.js + Supabase. Content (services, FAQs, contact details) lives in the database so the admin can manage it. Phase W1 ships the public site, the enquiry form and the admin enquiries inbox. Editing services, FAQs and settings from the admin screen is the next phase; until then edit them in the Supabase Table Editor.

## Set up
1. Create a NEW Supabase project for this site (do not reuse the Kodi project).
2. SQL editor: run `supabase/migrations/0001_site.sql`.
3. Authentication > Users > Add user: your email and a strong password (tick auto-confirm).
4. Make that user an admin (SQL editor, use your email):
   `insert into public.admin_profiles (id, full_name) select id, 'Owner' from auth.users where email = 'YOUR@EMAIL';`
5. Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
6. `cp .env.example .env.local` and fill in the project URL and anon key.
7. `npm install && npm run typecheck && npm run dev`
8. Public site: http://localhost:3000. Admin: http://localhost:3000/admin/login

## Edit the details now
Supabase > Table Editor > `site_settings` (phone_display, phone_tel like +2547XXXXXXXX, whatsapp like 2547XXXXXXXX, email, address, hours, about), `services`, `faqs`. Text in [square brackets] is a placeholder. The site refreshes within a minute.

## Deploy
Push to GitHub, import in Vercel, add the two env vars, deploy. Commercial client sites need a paid Vercel plan.
