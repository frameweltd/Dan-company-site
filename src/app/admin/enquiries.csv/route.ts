import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

type Row = { created_at: string; name: string; phone: string | null; email: string | null; service: string | null; message: string | null; status: string };

// Spreadsheet apps run cells starting with = + - @ as formulas, so those cells are neutralised.
const cell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await getAdmin())) return new NextResponse('Forbidden', { status: 403 });
  const db = await createClient();
  const { data } = await db.from('enquiries').select('*').order('created_at', { ascending: false });
  const rows = (data as Row[]) ?? [];
  const lines = [['Received (UTC)', 'Name', 'Phone', 'Email', 'Service', 'Message', 'Status'].map(cell).join(',')];
  for (const r of rows) lines.push([r.created_at, r.name, r.phone, r.email, r.service, r.message, r.status].map(cell).join(','));
  return new NextResponse('\ufeff' + lines.join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="enquiries.csv"', 'Cache-Control': 'no-store' },
  });
}
