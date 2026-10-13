'use client';

import { useState, useTransition } from 'react';
import { displayName, size } from '@/lib/docs';
import { deleteSubmission, getSignedUrl, markReviewed } from './actions';

export type Submission = {
  id: string; name: string; phone: string; email: string | null; topic: string | null; note: string | null;
  status: string; created: string; files: { path: string; size: number | null; type: string | null }[];
};

export function SubmissionCard({ s }: { s: Submission }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  const open = (path: string) => start(async () => {
    setMsg('');
    const r = await getSignedUrl(path);
    if (r.ok && r.url) window.open(r.url, '_blank', 'noopener');
    else setMsg(r.error ?? 'Failed');
  });
  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 6, padding: '1rem 1.25rem', display: 'grid', gap: '.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <strong>{s.name}</strong>
        <span><span className={`pill ${s.status === 'new' ? 'new' : ''}`}>{s.status}</span> <span style={{ color: 'var(--muted)' }}>{s.created}</span></span>
      </div>
      <div><a href={`tel:${s.phone}`}>{s.phone}</a>{s.email ? <> · <a href={`mailto:${s.email}`}>{s.email}</a></> : null}{s.topic ? <> · {s.topic}</> : null}</div>
      {s.note ? <p style={{ margin: 0 }}>{s.note}</p> : null}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '.4rem' }}>
        {s.files.map((f) => (
          <li key={f.path} style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn alt sm" type="button" disabled={pending} onClick={() => open(f.path)}>Open</button>
            <span>{displayName(f.path)}{f.size ? ` (${size(f.size)})` : ''}</span>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {s.status === 'new' ? <button className="btn sm" type="button" disabled={pending} onClick={() => start(async () => { await markReviewed(s.id); })}>Mark reviewed</button> : null}
        <button className="btn alt sm" type="button" disabled={pending}
          onClick={() => { if (window.confirm('Permanently delete these files and the record?')) start(async () => { const r = await deleteSubmission(s.id); if (!r.ok) setMsg(r.error ?? 'Failed'); }); }}>
          Delete
        </button>
        {msg ? <span role="alert" className="err">{msg}</span> : null}
      </div>
    </div>
  );
}
