import { createClient } from '@/lib/supabase/server';
import { ContentManager, type Row } from '../content/content-manager';

export const metadata = { title: 'Services' };

export default async function ServicesAdmin() {
  const db = await createClient();
  const { data } = await db.from('services').select('id, title, description, sort_order, is_published').order('sort_order');
  const rows: Row[] = ((data ?? []) as { id: string; title: string; description: string; sort_order: number; is_published: boolean }[]).map((r) => ({ id: r.id, a: r.title, b: r.description, sort_order: r.sort_order, is_published: r.is_published }));
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Services</h1>
      <ContentManager table="services" labels={{ a: 'Service name', b: 'Short description', add: 'Add a service' }} rows={rows} />
    </>
  );
}
