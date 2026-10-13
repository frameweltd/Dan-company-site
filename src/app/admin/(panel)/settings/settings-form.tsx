'use client';

import { useActionState } from 'react';
import { saveSettings, type SettingsState } from './actions';
import type { Settings } from '@/lib/site';

const F = ({ label, name, value, hint, area }: { label: string; name: string; value: string | null; hint?: string; area?: boolean }) => (
  <label>
    {label}
    {area ? <textarea name={name} defaultValue={value ?? ''} rows={6} maxLength={2000} /> : <input name={name} defaultValue={value ?? ''} />}
    {hint ? <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '.9rem' }}>{hint}</span> : null}
  </label>
);

export function SettingsForm({ s }: { s: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  return (
    <form action={action} style={{ maxWidth: '40rem' }}>
      <F label="Business name" name="business_name" value={s.business_name} />
      <F label="Town or area" name="city" value={s.city} hint="Shown in the stamp and footer, for example Eldoret CBD." />
      <F label="Main headline" name="tagline" value={s.tagline} />
      <F label="Phone number shown on the site" name="phone_display" value={s.phone_display} hint="For example 0712 345 678." />
      <F label="Phone number for the Call button" name="phone_tel" value={s.phone_tel} hint="Digits with country code, like +254712345678. Leave blank to hide the link." />
      <F label="WhatsApp number" name="whatsapp" value={s.whatsapp} hint="Digits only with country code, like 254712345678. Turns on the WhatsApp buttons." />
      <F label="Email address" name="email" value={s.email} />
      <F label="Office address" name="address" value={s.address} />
      <F label="Opening hours" name="hours" value={s.hours} />
      <F label="About text" name="about" value={s.about} area hint="Start a new line for a new paragraph." />
      {state.error ? <p role="alert" className="err">{state.error}</p> : null}
      {state.ok ? <p role="status" className="ok">Saved. The website updates straight away.</p> : null}
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
