'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

type R = { ok: boolean; error?: string };
const COLS = { services: ['title', 'description'], faqs: ['question', 'answer'] } as const;

const saveSchema = z.object({
  table: z.enum(['services', 'faqs']),
  id: z.string().uuid().nullable(),
  a: z.string().trim().min(2, 'Fill in the first box').max(200),
  b: z.string().trim().min(2, 'Fill in the second box').max(1000),
  sort_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

export async function saveContent(input: unknown): Promise<R> {
  if (!(await getAdmin())) return { ok: false, error: 'Not allowed.' };
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  const { table, id, a, b, sort_order, is_published } = parsed.data;
  const row = { [COLS[table][0]]: a, [COLS[table][1]]: b, sort_order, is_published };
  const db = await createClient();
  const q = id ? db.from(table).update(row).eq('id', id).select('id') : db.from(table).insert(row).select('id');
  const { data, error } = await q;
  if (error || !data || data.length === 0) return { ok: false, error: 'Could not save. Please try again.' };
  revalidatePath('/');
  revalidatePath(`/admin/${table}`);
  return { ok: true };
}

export async function deleteContent(input: unknown): Promise<R> {
  if (!(await getAdmin())) return { ok: false, error: 'Not allowed.' };
  const parsed = z.object({ table: z.enum(['services', 'faqs']), id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid request.' };
  const db = await createClient();
  const { data, error } = await db.from(parsed.data.table).delete().eq('id', parsed.data.id).select('id');
  if (error || !data || data.length === 0) return { ok: false, error: 'Could not delete.' };
  revalidatePath('/');
  revalidatePath(`/admin/${parsed.data.table}`);
  return { ok: true };
}
