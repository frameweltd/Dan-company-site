'use client';

import { useTransition } from 'react';
import { setEnquiryStatus } from './actions';

const STATUSES = ['new', 'contacted', 'closed'] as const;

export function StatusButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
      {STATUSES.filter((s) => s !== status).map((s) => (
        <button key={s} className="btn alt sm" type="button" disabled={pending} onClick={() => start(async () => { await setEnquiryStatus({ id, status: s }); })}>
          Mark {s}
        </button>
      ))}
    </div>
  );
}
