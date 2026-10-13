'use server';

import { z } from 'zod';
import { notifyEnquiry } from '@/lib/notify';
import { createClient } from '@/lib/supabase/server';

export type EnquiryState = { ok?: boolean; error?: string };

const schema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name.').max(100),
    phone: z.string().trim().max(30),
    email: z.string().trim().max(254).refine((v) => v === '' || z.string().email().safeParse(v).success, 'That email address does not look right.'),
    service: z.string().trim().max(100),
    message: z.string().trim().max(1000),
  })
  .refine((v) => v.phone !== '' || v.email !== '', { message: 'Add a phone number or an email so we can reach you.' });

export async function submitEnquiry(_prev: EnquiryState, fd: FormData): Promise<EnquiryState> {
  if (String(fd.get('website') ?? '') !== '') return { ok: true }; // honeypot: bots fill the hidden field
  const parsed = schema.safeParse({
    name: fd.get('name') ?? '', phone: fd.get('phone') ?? '', email: fd.get('email') ?? '',
    service: fd.get('service') ?? '', message: fd.get('message') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  const v = parsed.data;
  const db = await createClient();
  const { error } = await db.from('enquiries').insert({
    name: v.name, phone: v.phone || null, email: v.email || null, service: v.service || null, message: v.message || null,
  });
  if (error) return { error: 'We could not send your message. Please call or WhatsApp us instead.' };
  await notifyEnquiry({ name: v.name, phone: v.phone || null, email: v.email || null, service: v.service || null, message: v.message || null });
  return { ok: true };
}
