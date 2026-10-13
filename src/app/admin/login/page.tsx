import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/admin';
import { LoginForm } from './login-form';

export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');
  return (
    <main className="login">
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Admin sign in</h1>
      <LoginForm />
    </main>
  );
}
