import { createClient } from '@supabase/supabase-js';
import { sendEmail, when } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/** Called once a day by Vercel Cron. Emails everyone with a confirmed booking in the next 24 hours. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return new Response('Missing SUPABASE_SERVICE_ROLE_KEY', { status: 500 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 3600 * 1000);
  const [{ data: due }, { data: site }] = await Promise.all([
    db.from('bookings').select('id, name, email, service, slot_start').eq('status', 'confirmed').is('reminded_at', null)
      .gte('slot_start', now.toISOString()).lte('slot_start', until.toISOString()),
    db.from('site_settings').select('business_name, address').eq('id', 1).maybeSingle(),
  ]);
  let sent = 0;
  for (const b of (due ?? []) as { id: string; name: string; email: string | null; service: string | null; slot_start: string }[]) {
    if (!b.email) continue;
    await sendEmail(b.email, `Reminder: your appointment on ${when(b.slot_start)}`,
      `Hello ${b.name},\n\nThis is a reminder of your appointment with ${site?.business_name ?? 'us'} on ${when(b.slot_start)}.\n${site?.address ? `Where: ${site.address}\n` : ''}\nIf you cannot come, please call or message us.`);
    await db.from('bookings').update({ reminded_at: new Date().toISOString() }).eq('id', b.id);
    sent++;
  }
  return Response.json({ sent });
}
