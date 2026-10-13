'use server';

import { z } from 'zod';
import { notifyBooking } from '@/lib/notify';
import { getSite } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export type BookState = { ok?: boolean; error?: string; start?: string };

export async function getSlots(day: string): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
  const db = await createClient();
  const { data } = await db.rpc('open_slots', { p_day: day });
  return ((data ?? []) as { slot_start: string }[]).map((r) => r.slot_start);
}

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  phone: z.string().trim().min(7, 'Please enter a phone number we can reach you on.').max(30),
  email: z.string().trim().max(254).refine((v) => v === '' || z.string().email().safeParse(v).success, 'That email address does not look right.'),
  service: z.string().trim().max(100),
  notes: z.string().trim().max(500),
  slot: z.string().datetime({ offset: true }),
});

export async function bookSlot(_prev: BookState, fd: FormData): Promise<BookState> {
  if (String(fd.get('website') ?? '') !== '') return { ok: true }; // honeypot
  const parsed = schema.safeParse({
    name: fd.get('name') ?? '', phone: fd.get('phone') ?? '', email: fd.get('email') ?? '',
    service: fd.get('service') ?? '', notes: fd.get('notes') ?? '', slot: fd.get('slot') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message?.includes('Invalid datetime') ? 'Please pick a time first.' : (parsed.error.issues[0]?.message ?? 'Please check the form.') };
  const v = parsed.data;
  const db = await createClient();
  const { error } = await db.rpc('book_slot', { p_name: v.name, p_phone: v.phone, p_email: v.email, p_service: v.service, p_start: v.slot, p_notes: v.notes });
  if (error) return { error: error.code === 'P0001' ? error.message : 'We could not complete your booking. Please call us instead.' };
  const { settings } = await getSite();
  await notifyBooking({ name: v.name, phone: v.phone, email: v.email || null, service: v.service || null, start: v.slot, business: settings.business_name, address: settings.address });
  return { ok: true, start: v.slot };
}
