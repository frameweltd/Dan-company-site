import { createClient } from '@/lib/supabase/server';
import { toIntl } from '@/lib/site';
import { BookingButtons } from './booking-buttons';

export const metadata = { title: 'Bookings' };
type Row = { id: string; name: string; phone: string; email: string | null; service: string | null; notes: string | null; slot_start: string; status: string };
const when = (iso: string) => new Intl.DateTimeFormat('en-KE', { timeZone: 'Africa/Nairobi', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function Table({ rows, actions }: { rows: Row[]; actions: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="t">
        <thead><tr><th>When (EAT)</th><th>Client</th><th>Service</th><th>Notes</th><th>Status</th>{actions ? <th /> : null}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={actions ? 6 : 5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Nothing here.</td></tr> : rows.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{when(r.slot_start)}</td>
              <td><strong>{r.name}</strong><br /><a href={`tel:${r.phone}`}>{r.phone}</a>{toIntl(r.phone).length >= 11 ? <> · <a href={`https://wa.me/${toIntl(r.phone)}`} target="_blank" rel="noopener">WhatsApp</a></> : null}{r.email ? <><br /><a href={`mailto:${r.email}`}>{r.email}</a></> : null}</td>
              <td>{r.service ?? ''}</td>
              <td style={{ maxWidth: '18rem' }}>{r.notes ?? ''}</td>
              <td><span className="pill">{r.status.replace('_', ' ')}</span></td>
              {actions ? <td><BookingButtons id={r.id} /></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BookingsPage() {
  const db = await createClient();
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data } = await db.from('bookings').select('*').gte('slot_start', since).order('slot_start', { ascending: true }).limit(400);
  const rows = (data as Row[]) ?? [];
  const now = Date.now();
  const upcoming = rows.filter((r) => r.status === 'confirmed' && new Date(r.slot_start).getTime() >= now);
  const past = rows.filter((r) => !upcoming.includes(r)).reverse();
  return (
    <>
      <h1 style={{ fontSize: '2rem' }}>Bookings</h1>
      <div className="stats"><div className="stat"><b>{upcoming.length}</b>Upcoming</div></div>
      <h2 style={{ fontSize: '1.2rem', margin: '0 0 .6rem' }}>Upcoming</h2>
      <Table rows={upcoming} actions />
      <h2 style={{ fontSize: '1.2rem', margin: '2rem 0 .6rem' }}>Earlier and cancelled (last 60 days)</h2>
      <Table rows={past} actions={false} />
    </>
  );
}
