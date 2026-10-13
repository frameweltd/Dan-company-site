import { createClient } from '@supabase/supabase-js';

export type Settings = {
  business_name: string; city: string; tagline: string | null; phone_display: string | null; phone_tel: string | null;
  whatsapp: string | null; email: string | null; address: string | null; hours: string | null; about: string | null;
};
export type Service = { id: string; title: string; description: string };
export type Faq = { id: string; question: string; answer: string };

const DEFAULTS: Settings = {
  business_name: 'Dan Company', city: 'Eldoret CBD', tagline: 'KRA and tax services, close to you in Eldoret CBD.',
  phone_display: '[Phone number]', phone_tel: null, whatsapp: null, email: '[Email address]',
  address: '[Building and floor], Eldoret CBD, Eldoret', hours: '[Opening hours]', about: null,
};

/** Public, cookie-free read so the home page can be cached and refreshed every minute. */
export async function getSite(): Promise<{ settings: Settings; services: Service[]; faqs: Faq[] }> {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const [s, sv, fq] = await Promise.all([
      db.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      db.from('services').select('id, title, description').eq('is_published', true).order('sort_order'),
      db.from('faqs').select('id, question, answer').eq('is_published', true).order('sort_order'),
    ]);
    return { settings: { ...DEFAULTS, ...((s.data as Partial<Settings>) ?? {}) }, services: (sv.data as Service[]) ?? [], faqs: (fq.data as Faq[]) ?? [] };
  } catch {
    return { settings: DEFAULTS, services: [], faqs: [] };
  }
}

export const isSet = (v: string | null | undefined): v is string => !!v && !v.startsWith('[');
export const waDigits = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '');
/** Local Kenyan numbers (07..) become 2547.. for wa.me links. */
export function toIntl(v: string): string {
  const d = waDigits(v);
  return d.startsWith('0') ? '254' + d.slice(1) : d;
}
