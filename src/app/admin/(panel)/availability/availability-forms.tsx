'use client';

import { useActionState, useTransition } from 'react';
import { addBlocked, removeBlocked, saveConfig, saveHours, type FormState } from './actions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export type Hours = { weekday: number; is_open: boolean; opens: string; closes: string };
export type Config = { slot_minutes: number; advance_days: number; min_notice_hours: number };

const Msg = ({ s }: { s: FormState }) => (s.error ? <p role="alert" className="err">{s.error}</p> : s.ok ? <p role="status" className="ok">Saved.</p> : null);
const card = { border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 6, padding: '1.25rem', maxWidth: '40rem' } as const;

export function ConfigForm({ cfg }: { cfg: Config }) {
  const [s, action, pending] = useActionState<FormState, FormData>(saveConfig, {});
  return (
    <form action={action} style={card}>
      <h2 style={{ fontSize: '1.2rem' }}>Appointments</h2>
      <label>Length of each appointment (minutes)<input name="slot_minutes" type="number" min={10} max={240} defaultValue={cfg.slot_minutes} /></label>
      <label>How many days ahead people can book<input name="advance_days" type="number" min={1} max={180} defaultValue={cfg.advance_days} /></label>
      <label>Minimum notice (hours)<input name="min_notice_hours" type="number" min={0} max={168} defaultValue={cfg.min_notice_hours} /></label>
      <Msg s={s} /><button className="btn sm" type="submit" disabled={pending}>Save</button>
    </form>
  );
}

export function HoursForm({ hours }: { hours: Hours[] }) {
  const [s, action, pending] = useActionState<FormState, FormData>(saveHours, {});
  return (
    <form action={action} style={card}>
      <h2 style={{ fontSize: '1.2rem' }}>Weekly opening hours (Kenya time)</h2>
      {hours.map((h) => (
        <div key={h.weekday} style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '9rem' }}>
            <input name={`open_${h.weekday}`} type="checkbox" defaultChecked={h.is_open} style={{ width: 'auto', minHeight: 0 }} /> {DAYS[h.weekday]}
          </label>
          <input name={`opens_${h.weekday}`} type="time" defaultValue={h.opens} style={{ width: '8rem' }} aria-label={`${DAYS[h.weekday]} opens`} />
          <span>to</span>
          <input name={`closes_${h.weekday}`} type="time" defaultValue={h.closes} style={{ width: '8rem' }} aria-label={`${DAYS[h.weekday]} closes`} />
        </div>
      ))}
      <Msg s={s} /><button className="btn sm" type="submit" disabled={pending}>Save hours</button>
    </form>
  );
}

export function BlockedForm({ days }: { days: { day: string; reason: string | null }[] }) {
  const [s, action, pending] = useActionState<FormState, FormData>(addBlocked, {});
  const [, start] = useTransition();
  return (
    <div style={card}>
      <h2 style={{ fontSize: '1.2rem' }}>Days off and holidays</h2>
      <form action={action}>
        <label>Date<input name="day" type="date" required /></label>
        <label>Reason (optional)<input name="reason" maxLength={100} /></label>
        <Msg s={s} /><button className="btn sm" type="submit" disabled={pending}>Block this day</button>
      </form>
      <ul style={{ margin: '1rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '.4rem' }}>
        {days.length === 0 ? <li style={{ color: 'var(--muted)' }}>No days blocked.</li> : days.map((d) => (
          <li key={d.day} style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <span>{d.day}{d.reason ? `, ${d.reason}` : ''}</span>
            <button className="btn alt sm" type="button" onClick={() => start(async () => { await removeBlocked(d.day); })}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
