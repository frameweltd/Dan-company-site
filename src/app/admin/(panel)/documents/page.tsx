import { createClient } from '@/lib/supabase/server';
import { SubmissionCard, type Submission } from './submission-card';

export const metadata = { title: 'Documents' };
type Row = { id: string; name: string; phone: string; email: string | null; topic: string | null; note: string | null; status: string; files: Submission['files']; created_at: string };
const when = (iso: string) => new Intl.DateTimeFormat('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export default async function DocumentsPage() {
  const db = await createClient();
  const { data } = await db.from('document_submissions').select('*').in('status', ['new', 'reviewed']).order('created_at', { ascending: false }).limit(100);
  const rows = ((data as Row[]) ?? []).map((r) => ({ ...r, created: when(r.created_at) }));
  return (
    <>
      <h1 style={{ fontSize: '2rem' }}>Client documents</h1>
      <div className="stats"><div className="stat"><b>{rows.filter((r) => r.status === 'new').length}</b>To review</div></div>
      <p style={{ color: 'var(--muted)', maxWidth: '40rem' }}>Files open through a link that expires after a minute. Delete files once you no longer need them.</p>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '48rem' }}>
        {rows.length === 0 ? <p>No documents yet.</p> : rows.map((r) => <SubmissionCard key={r.id} s={r} />)}
      </div>
    </>
  );
}
