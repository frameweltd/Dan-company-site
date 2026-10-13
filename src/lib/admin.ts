import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Admin = { id: string; name: string; email: string };

export async function getAdmin(): Promise<Admin | null> {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('admin_profiles').select('full_name, is_active').eq('id', user.id).maybeSingle();
  return data?.is_active ? { id: user.id, name: data.full_name as string, email: user.email ?? '' } : null;
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
