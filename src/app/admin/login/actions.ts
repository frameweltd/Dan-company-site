'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { error?: string };
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(72) });

export async function signIn(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: fd.get('email'), password: fd.get('password') });
  if (!parsed.success) return { error: 'Enter your email and password.' };
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Invalid email or password.' };
  if (!(await getAdmin())) {
    await db.auth.signOut();
    return { error: 'This account does not have admin access.' };
  }
  redirect('/admin');
}
