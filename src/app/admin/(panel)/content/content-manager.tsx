'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { deleteContent, saveContent } from './actions';

export type Row = { id: string; a: string; b: string; sort_order: number; is_published: boolean };
type Table = 'services' | 'faqs';

function Editor({ table, row, labels, nextOrder, onSaved }: { table: Table; row: Row | null; labels: { a: string; b: string }; nextOrder: number; onSaved?: () => void }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    start(async () => {
      const res = await saveContent({
        table, id: row?.id ?? null, a: String(fd.get('a') ?? ''), b: String(fd.get('b') ?? ''),
        sort_order: Number(fd.get('sort_order') ?? 0), is_published: fd.get('is_published') === 'on',
      });
      setMsg({ ok: res.ok, text: res.ok ? 'Saved' : (res.error ?? 'Failed') });
      if (res.ok && !row) { form.reset(); onSaved?.(); }
    });
  };

  const remove = () => {
    if (!row || !window.confirm('Delete this entry? This cannot be undone.')) return;
    start(async () => { const res = await deleteContent({ table, id: row.id }); if (!res.ok) setMsg({ ok: false, text: res.error ?? 'Failed' }); });
  };

  return (
    <form onSubmit={submit} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 6, padding: '1rem', display: 'grid', gap: '.75rem' }}>
      <label>{labels.a}<input name="a" defaultValue={row?.a ?? ''} required maxLength={200} /></label>
      <label>{labels.b}<textarea name="b" defaultValue={row?.b ?? ''} required maxLength={1000} rows={3} /></label>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>Order
          <input name="sort_order" type="number" min={0} max={9999} defaultValue={row?.sort_order ?? nextOrder} style={{ width: '5rem' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <input name="is_published" type="checkbox" defaultChecked={row?.is_published ?? true} style={{ width: 'auto', minHeight: 0 }} /> Show on website
        </label>
        <button className="btn sm" type="submit" disabled={pending}>{pending ? 'Saving…' : row ? 'Save' : 'Add'}</button>
        {row ? <button className="btn alt sm" type="button" disabled={pending} onClick={remove}>Delete</button> : null}
        {msg ? <span role="status" className={msg.ok ? 'ok' : 'err'}>{msg.text}</span> : null}
      </div>
    </form>
  );
}

export function ContentManager({ table, labels, rows }: { table: Table; labels: { a: string; b: string; add: string }; rows: Row[] }) {
  const nextOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0) + 1;
  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '44rem' }}>
      <h2 style={{ fontSize: '1.2rem' }}>{labels.add}</h2>
      <Editor key={`new-${nextOrder}`} table={table} row={null} labels={labels} nextOrder={nextOrder} />
      <h2 style={{ fontSize: '1.2rem', marginTop: '1rem' }}>Existing ({rows.length})</h2>
      {rows.map((r) => <Editor key={r.id} table={table} row={r} labels={labels} nextOrder={nextOrder} />)}
    </div>
  );
}
