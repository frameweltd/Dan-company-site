'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ id: z.string().uuid(), status: z.enum(['new', 'contacted', 'closed']) });

export async function setEnquiryStatus(input: unknown): Promise<{ ok: boolean; error?: string }> {
  if (!(await getAdmin())) return { ok: false, error: 'Not allowed.' };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid request.' };
  const db = await createClient();
  const { data, error } = await db.from('enquiries').update({ status: parsed.data.status }).eq('id', parsed.data.id).select('id');
  if (error || !data || data.length === 0) return { ok: false, error: 'Could not update.' };
  revalidatePath('/admin');
  return { ok: true };
}
