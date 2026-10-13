'use client';

import { useState, type FormEvent } from 'react';
import { ACCEPT, ALLOWED_TYPES, BUCKET, MAX_BYTES, MAX_FILES, safeName, size } from '@/lib/docs';
import { createClient } from '@/lib/supabase/client';

export function UploadForm({ topics }: { topics: string[] }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(0);

  const pick = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    setError('');
    if (arr.length > MAX_FILES) return setError(`Please send at most ${MAX_FILES} files at a time.`), setFiles([]);
    const bad = arr.find((f) => f.size > MAX_BYTES || !ALLOWED_TYPES[f.type]);
    if (bad) return setError(`"${bad.name}" cannot be sent. Use PDF, JPG, PNG, WEBP, DOCX or XLSX files under 10 MB.`), setFiles([]);
    setFiles(arr);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (String(fd.get('website') ?? '') !== '') return setDone(1);
    if (files.length === 0) return setError('Please choose at least one file.');
    setBusy(true); setError('');
    const sb = createClient();
    try {
      setStep('Preparing…');
      const { data: id, error: e1 } = await sb.rpc('create_submission', {
        p_name: String(fd.get('name') ?? ''), p_phone: String(fd.get('phone') ?? ''), p_email: String(fd.get('email') ?? ''),
        p_topic: String(fd.get('topic') ?? ''), p_note: String(fd.get('note') ?? ''),
      });
      if (e1 || !id) throw new Error(e1?.code === 'P0001' ? e1.message : 'We could not start your upload. Please try again or contact us.');
      for (let i = 0; i < files.length; i++) {
        setStep(`Uploading file ${i + 1} of ${files.length}…`);
        const { error: e2 } = await sb.storage.from(BUCKET).upload(`${id}/${i}-${safeName(files[i].name)}`, files[i], { contentType: files[i].type, upsert: false });
        if (e2) throw new Error(`"${files[i].name}" could not be uploaded. Please check the file and try again.`);
      }
      setStep('Finishing…');
      const { data: n, error: e3 } = await sb.rpc('finish_submission', { p_id: id });
      if (e3) throw new Error(e3.code === 'P0001' ? e3.message : 'We could not finish your upload. Please try again.');
      setDone(Number(n) || files.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false); setStep('');
    }
  };

  if (done) return <p role="status" className="ok">Thank you. We received {done > 1 ? `${done} files` : 'your file'} and will contact you soon.</p>;

  return (
    <form onSubmit={submit} style={{ maxWidth: '36rem' }}>
      <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} /></label>
      <label>Email (optional)<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
      <label>What are these documents for?
        <select name="topic">{topics.map((t) => <option key={t}>{t}</option>)}<option>Something else</option></select>
      </label>
      <label>Note (optional)<textarea name="note" maxLength={500} /></label>
      <label>Files (up to {MAX_FILES}, 10 MB each)
        <input type="file" multiple accept={ACCEPT} onChange={(e) => pick(e.target.files)} />
        <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '.9rem' }}>PDF, JPG, PNG, WEBP, DOCX or XLSX.</span>
      </label>
      {files.length > 0 ? <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{files.map((f) => <li key={f.name + f.size}>{f.name} ({size(f.size)})</li>)}</ul> : null}
      <div className="hp" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontWeight: 400 }}>
        <input type="checkbox" required style={{ width: 'auto', minHeight: 0, marginTop: '.35rem' }} />
        <span>I agree that you may use these documents to provide the service I asked for. They are stored privately and only the office team can open them.</span>
      </label>
      {error ? <p role="alert" className="err">{error}</p> : null}
      {busy ? <p role="status">{step}</p> : null}
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send documents'}</button>
    </form>
  );
}
