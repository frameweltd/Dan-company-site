'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

export type SettingsState = { ok?: boolean; error?: string };

const optional = (re: RegExp, msg: string) => z.string().trim().refine((v) => v === '' || re.test(v), msg);
const schema = z.object({
  business_name: z.string().trim().min(2, 'Enter the business name').max(80),
  city: z.string().trim().min(2, 'Enter the town or area').max(60),
  tagline: z.string().trim().min(3, 'Enter the main headline').max(160),
  phone_display: z.string().trim().max(40),
  phone_tel: optional(/^\+?[0-9]{9,15}$/, 'Call-link number: digits only, like +254712345678'),
  whatsapp: optional(/^[0-9]{11,15}$/, 'WhatsApp number: digits only with country code, like 254712345678'),
  email: z.string().trim().max(254).refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email address'),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(200),
  about: z.string().trim().max(2000),
});

export async function saveSettings(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  if (!(await getAdmin())) return { error: 'Not allowed.' };
  const parsed = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, fd.get(k) ?? ''])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  const v = parsed.data;
  const n = (s: string) => (s === '' ? null : s);
  const db = await createClient();
  const { error } = await db.from('site_settings').upsert({
    id: 1, business_name: v.business_name, city: v.city, tagline: v.tagline, phone_display: n(v.phone_display), phone_tel: n(v.phone_tel),
    whatsapp: n(v.whatsapp), email: n(v.email), address: n(v.address), hours: n(v.hours), about: n(v.about), updated_at: new Date().toISOString(),
  });
  if (error) return { error: 'Could not save. Please try again.' };
  revalidatePath('/');
  return { ok: true };
}
