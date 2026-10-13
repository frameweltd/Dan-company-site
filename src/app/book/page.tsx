import { getSite } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';
import { BookingWidget } from './booking-widget';

export const metadata = { title: 'Book an appointment' };
export const dynamic = 'force-dynamic';

const ymd = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });

export default async function BookPage() {
  const { settings: s, services } = await getSite();
  const db = await createClient();
  const { data: cfg } = await db.from('booking_config').select('*').eq('id', 1).maybeSingle();
  return (
    <>
      <header className="top"><div className="wrap bar"><a className="brand" href="/">{s.business_name}</a><a className="btn alt sm" href="/">Back to the website</a></div></header>
      <main className="wrap" style={{ padding: '3rem 1.25rem 5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: '.5rem' }}>Book an appointment</h1>
        <p className="intro">Pick a day and a time that suits you. You will get a confirmation straight away.</p>
        {cfg ? (
          <BookingWidget services={services.map((v) => v.title)} minDate={ymd(Date.now())} maxDate={ymd(Date.now() + cfg.advance_days * 864e5)} slotMinutes={cfg.slot_minutes}
            business={s.business_name} address={s.address} whatsapp={s.whatsapp} />
        ) : <p>Online booking is not set up yet. Please call or message us.</p>}
      </main>
    </>
  );
}
