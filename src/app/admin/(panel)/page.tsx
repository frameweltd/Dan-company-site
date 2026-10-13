import { createClient } from '@/lib/supabase/server';
import { toIntl } from '@/lib/site';
import { StatusButtons } from './status-buttons';

export const metadata = { title: 'Enquiries' };

type Row = { id: string; name: string; phone: string | null; email: string | null; service: string | null; message: string | null; status: string; created_at: string };
const when = (iso: string) => new Intl.DateTimeFormat('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export default async function EnquiriesPage() {
  const db = await createClient();
  const { data } = await db.from('enquiries').select('*').order('created_at', { ascending: false }).limit(200);
  const rows = (data as Row[]) ?? [];
  const n = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '2rem' }}>Enquiries</h1>
        <a className="btn alt sm" href="/admin/enquiries.csv">Export CSV</a>
      </div>
      <div className="stats">
        <div className="stat"><b>{n('new')}</b>New</div>
        <div className="stat"><b>{n('contacted')}</b>Contacted</div>
        <div className="stat"><b>{n('closed')}</b>Closed</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="t">
          <thead><tr><th>Received (EAT)</th><th>From</th><th>Needs</th><th>Message</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No enquiries yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{when(r.created_at)}</td>
                <td>
                  <strong>{r.name}</strong><br />
                  {r.phone ? <><a href={`tel:${r.phone}`}>{r.phone}</a>{toIntl(r.phone).length >= 11 ? <> · <a href={`https://wa.me/${toIntl(r.phone)}`} target="_blank" rel="noopener">WhatsApp</a></> : null}<br /></> : null}
                  {r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : null}
                </td>
                <td>{r.service ?? ''}</td>
                <td style={{ maxWidth: '22rem' }}>{r.message ?? ''}</td>
                <td><span className={`pill ${r.status}`}>{r.status}</span></td>
                <td><StatusButtons id={r.id} status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
