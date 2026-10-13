import { createClient } from '@/lib/supabase/server';
import { BlockedForm, ConfigForm, HoursForm, type Config, type Hours } from './availability-forms';

export const metadata = { title: 'Availability' };

export default async function AvailabilityPage() {
  const db = await createClient();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
  const [{ data: cfg }, { data: hrs }, { data: blocked }] = await Promise.all([
    db.from('booking_config').select('*').eq('id', 1).maybeSingle(),
    db.from('opening_hours').select('*').order('weekday'),
    db.from('blocked_dates').select('day, reason').gte('day', today).order('day'),
  ]);
  const byDay = new Map(((hrs ?? []) as Hours[]).map((h) => [h.weekday, h]));
  const hours: Hours[] = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = byDay.get(d);
    return { weekday: d, is_open: h?.is_open ?? false, opens: (h?.opens ?? '09:00').slice(0, 5), closes: (h?.closes ?? '17:00').slice(0, 5) };
  });
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Availability</h1>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <ConfigForm cfg={(cfg as Config) ?? { slot_minutes: 30, advance_days: 30, min_notice_hours: 4 }} />
        <HoursForm hours={hours} />
        <BlockedForm days={(blocked ?? []) as { day: string; reason: string | null }[]} />
      </div>
    </>
  );
}
