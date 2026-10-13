'use client';

import { useTransition } from 'react';
import { setBookingStatus } from './actions';

const LABELS = { cancelled: 'Cancel', completed: 'Mark done', no_show: 'No-show' } as const;

export function BookingButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
      {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((s) => (
        <button key={s} className="btn alt sm" type="button" disabled={pending}
          onClick={() => { if (s !== 'cancelled' || window.confirm('Cancel this booking?')) start(async () => { await setBookingStatus({ id, status: s }); }); }}>
          {LABELS[s]}
        </button>
      ))}
    </div>
  );
}
