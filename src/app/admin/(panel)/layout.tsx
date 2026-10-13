import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/admin';

export const metadata = { robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <header className="admbar">
        <strong>Admin</strong>
        <a href="/admin">Enquiries</a>
        <a href="/admin/bookings">Bookings</a>
        <a href="/admin/availability">Availability</a>
        <a href="/admin/documents">Documents</a>
        <a href="/admin/settings">Site details</a>
        <a href="/admin/services">Services</a>
        <a href="/admin/faqs">FAQs</a>
        <span style={{ marginLeft: 'auto' }}>{admin.name}</span>
        <a href="/" target="_blank" rel="noopener">View site</a>
        <form action="/admin/signout" method="post"><button className="btn alt sm" type="submit">Sign out</button></form>
      </header>
      <main className="wrap admmain">{children}</main>
    </>
  );
}
