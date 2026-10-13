'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { BUCKET, PATH_RE } from '@/lib/docs';
import { createClient } from '@/lib/supabase/server';

type R = { ok: boolean; error?: string; url?: string };

/** A link that works for 60 seconds. Files are never public. */
export async function getSignedUrl(path: string): Promise<R> {
  if (!(await getAdmin())) return { ok: false, error: 'Not allowed.' };
  if (!PATH_RE.test(path)) return { ok: false, error: 'Invalid file.' };
  const db = await createClient();
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data) return { ok: false, error: 'Could not open the file.' };
  return { ok: true, url: data.signedUrl };
}

export async function markReviewed(id: string): Promise<R> {
  if (!(await getAdmin()) || !z.string().uuid().safeParse(id).success) return { ok: false, error: 'Not allowed.' };
  const db = await createClient();
  const { data, error } = await db.from('document_submissions').update({ status: 'reviewed' }).eq('id', id).select('id');
  if (error || !data || data.length === 0) return { ok: false, error: 'Could not update.' };
  revalidatePath('/admin/documents');
  return { ok: true };
}

export async function deleteSubmission(id: string): Promise<R> {
  if (!(await getAdmin()) || !z.string().uuid().safeParse(id).success) return { ok: false, error: 'Not allowed.' };
  const db = await createClient();
  const { data: row } = await db.from('document_submissions').select('files').eq('id', id).maybeSingle();
  const paths = ((row?.files ?? []) as { path: string }[]).map((f) => f.path).filter((p) => PATH_RE.test(p));
  if (paths.length > 0) {
    const { error } = await db.storage.from(BUCKET).remove(paths);
    if (error) return { ok: false, error: 'Could not delete the files.' };
  }
  const { error } = await db.from('document_submissions').delete().eq('id', id);
  if (error) return { ok: false, error: 'Could not delete the record.' };
  revalidatePath('/admin/documents');
  return { ok: true };
}
