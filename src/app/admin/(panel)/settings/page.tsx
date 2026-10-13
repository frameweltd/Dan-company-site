import { createClient } from '@/lib/supabase/server';
import type { Settings } from '@/lib/site';
import { SettingsForm } from './settings-form';

export const metadata = { title: 'Site details' };

const BLANK: Settings = { business_name: 'Dan Company', city: 'Eldoret CBD', tagline: '', phone_display: '', phone_tel: '', whatsapp: '', email: '', address: '', hours: '', about: '' };

export default async function SettingsPage() {
  const db = await createClient();
  const { data } = await db.from('site_settings').select('*').eq('id', 1).maybeSingle();
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Site details</h1>
      <SettingsForm s={{ ...BLANK, ...((data as Partial<Settings>) ?? {}) }} />
    </>
  );
}
