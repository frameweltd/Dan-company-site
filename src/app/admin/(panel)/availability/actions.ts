'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

export type FormState = { ok?: boolean; error?: string };
const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveConfig(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return { error: 'Not allowed.' };
  const parsed = z.object({
    slot_minutes: z.number().int().min(10, 'Appointments must be at least 10 minutes').max(240),
    advance_days: z.number().int().min(1).max(180),
    min_notice_hours: z.number().int().min(0).max(168),
  }).safeParse({ slot_minutes: Number(fd.get('slot_minutes')), advance_days: Number(fd.get('advance_days')), min_notice_hours: Number(fd.get('min_notice_hours')) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the numbers.' };
  const db = await createClient();
  const { error } = await db.from('booking_config').upsert({ id: 1, ...parsed.data });
  if (error) return { error: 'Could not save.' };
  revalidatePath('/book');
  return { ok: true };
}

export async function saveHours(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return { error: 'Not allowed.' };
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const opens = String(fd.get(`opens_${d}`) ?? ''), closes = String(fd.get(`closes_${d}`) ?? '');
    if (!hhmm.test(opens) || !hhmm.test(closes)) return { error: 'Enter every time like 09:00.' };
    if (closes <= opens) return { error: 'Closing time must be after opening time.' };
    rows.push({ weekday: d, is_open: fd.get(`open_${d}`) === 'on', opens, closes });
  }
  const db = await createClient();
  const { error } = await db.from('opening_hours').upsert(rows);
  if (error) return { error: 'Could not save.' };
  revalidatePath('/book');
  return { ok: true };
}

export async function addBlocked(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return { error: 'Not allowed.' };
  const parsed = z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'), reason: z.string().trim().max(100) }).safeParse({ day: fd.get('day'), reason: fd.get('reason') ?? '' });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const db = await createClient();
  const { error } = await db.from('blocked_dates').upsert({ day: parsed.data.day, reason: parsed.data.reason || null });
  if (error) return { error: 'Could not save.' };
  revalidatePath('/admin/availability');
  return { ok: true };
}

export async function removeBlocked(day: string): Promise<void> {
  if (!(await getAdmin()) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const db = await createClient();
  await db.from('blocked_dates').delete().eq('day', day);
  revalidatePath('/admin/availability');
}
