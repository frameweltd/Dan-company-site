'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { bookSlot, getSlots, type BookState } from './actions';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit' });
const nice = (iso: string) => new Intl.DateTimeFormat('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function BookingWidget(p: { services: string[]; minDate: string; maxDate: string; slotMinutes: number; business: string; address: string | null; whatsapp: string | null }) {
  const [day, setDay] = useState('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState('');
  const [loading, load] = useTransition();
  const [state, action, pending] = useActionState<BookState, FormData>(bookSlot, {});

  const pick = (d: string) => {
    setDay(d); setSlot(''); setSlots(null);
    if (d) load(async () => setSlots(await getSlots(d)));
  };
  useEffect(() => { if (state.error && day) load(async () => setSlots(await getSlots(day))); }, [state.error]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.ok && state.start) {
    const start = new Date(state.start), end = new Date(start.getTime() + p.slotMinutes * 60000);
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Booking//EN', 'BEGIN:VEVENT', `UID:${crypto.randomUUID()}@booking`, `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`, `SUMMARY:Appointment with ${p.business}`, `LOCATION:${(p.address ?? '').replace(/[,;\n]/g, ' ')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return (
      <div className="result" role="status" style={{ display: 'grid' }}>
        <h2 style={{ fontSize: '1.6rem' }}>You are booked</h2>
        <p>{nice(state.start)}{p.address ? ` at ${p.address}` : ''}.</p>
        <div className="cta">
          <a className="btn" href={'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics)} download="appointment.ics">Add to my calendar</a>
          <a className="btn alt" href="/">Back to the website</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <label style={{ maxWidth: '16rem' }}>Choose a date
        <input type="date" value={day} min={p.minDate} max={p.maxDate} onChange={(e) => pick(e.target.value)} />
      </label>
      {day ? (
        <div aria-live="polite">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '.6rem' }}>Available times</h2>
          {loading || slots === null ? <p>Checking times…</p> : slots.length === 0 ? <p>No times are available on this day. Please try another date.</p> : (
            <div className="chips">
              {slots.map((s) => <button key={s} type="button" className="chip" aria-pressed={slot === s} onClick={() => setSlot(s)}>{time(s)}</button>)}
            </div>
          )}
        </div>
      ) : null}
      {slot ? (
        <form action={action} style={{ maxWidth: '32rem' }}>
          <input type="hidden" name="slot" value={slot} />
          <p style={{ margin: 0 }}><strong>{nice(slot)}</strong></p>
          <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} /></label>
          <label>Email (optional, for a confirmation)<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
          <label>What do you need help with?
            <select name="service">{p.services.map((s) => <option key={s}>{s}</option>)}<option>Something else</option></select>
          </label>
          <label>Anything we should know? (optional)<textarea name="notes" maxLength={500} /></label>
          <div className="hp" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          {state.error ? <p role="alert" className="err">{state.error}</p> : null}
          <button className="btn" type="submit" disabled={pending}>{pending ? 'Booking…' : 'Confirm booking'}</button>
        </form>
      ) : null}
    </div>
  );
}
