import { createClient } from '@/lib/supabase/server';
import { ContentManager, type Row } from '../content/content-manager';

export const metadata = { title: 'FAQs' };

export default async function FaqsAdmin() {
  const db = await createClient();
  const { data } = await db.from('faqs').select('id, question, answer, sort_order, is_published').order('sort_order');
  const rows: Row[] = ((data ?? []) as { id: string; question: string; answer: string; sort_order: number; is_published: boolean }[]).map((r) => ({ id: r.id, a: r.question, b: r.answer, sort_order: r.sort_order, is_published: r.is_published }));
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Questions and answers</h1>
      <ContentManager table="faqs" labels={{ a: 'Question', b: 'Answer', add: 'Add a question' }} rows={rows} />
    </>
  );
}
