'use client';

import { useActionState } from 'react';
import { submitEnquiry, type EnquiryState } from './actions';

export function EnquiryForm({ services }: { services: string[] }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, {});
  if (state.ok) {
    return (
      <p role="status" className="ok">
        Thank you. We have your message and will get back to you.
      </p>
    );
  }
  return (
    <form action={action}>
      <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>
      <label>Email (optional)<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
      <label>What do you need help with?
        <select name="service">
          {services.map((s) => <option key={s}>{s}</option>)}
          <option>Something else</option>
        </select>
      </label>
      <label>Message<textarea name="message" maxLength={1000} /></label>
      <div className="hp" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {state.error ? <p role="alert" className="err">{state.error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
