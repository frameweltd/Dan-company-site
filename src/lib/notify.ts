/** Email through Resend. Does nothing unless RESEND_API_KEY is set. Never throws: the booking or enquiry is already saved. */
export async function sendEmail(to: string | string[], subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const list = (Array.isArray(to) ? to : [to]).map((s) => s.trim()).filter(Boolean);
  if (!key || list.length === 0) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM ?? 'Website <onboarding@resend.dev>', to: list, subject: subject.replace(/[\r\n]+/g, ' ').slice(0, 150), text }),
    });
  } catch {
    /* ignore */
  }
}

const office = () => (process.env.NOTIFY_TO ?? '').split(',');

export async function notifyEnquiry(e: { name: string; phone: string | null; email: string | null; service: string | null; message: string | null }) {
  await sendEmail(office(), `New enquiry from ${e.name}`, `Name: ${e.name}\nPhone: ${e.phone ?? '-'}\nEmail: ${e.email ?? '-'}\nNeeds: ${e.service ?? '-'}\n\n${e.message ?? ''}\n\nOpen the admin page to reply.`);
}

export const when = (iso: string) =>
  new Intl.DateTimeFormat('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));

export async function notifyBooking(b: { name: string; phone: string; email: string | null; service: string | null; start: string; business: string; address: string | null }) {
  await sendEmail(office(), `New booking: ${b.name}, ${when(b.start)}`, `Name: ${b.name}\nPhone: ${b.phone}\nEmail: ${b.email ?? '-'}\nService: ${b.service ?? '-'}\nWhen: ${when(b.start)}`);
  if (b.email) {
    await sendEmail(b.email, `Your appointment with ${b.business}`, `Hello ${b.name},\n\nYour appointment is confirmed for ${when(b.start)}.\n${b.service ? `Service: ${b.service}\n` : ''}${b.address ? `Where: ${b.address}\n` : ''}\nIf you need to change it, please call or message us.\n\n${b.business}`);
  }
}
