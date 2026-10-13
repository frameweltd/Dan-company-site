import { getSite } from '@/lib/site';
import { UploadForm } from './upload-form';

export const metadata = { title: 'Send documents securely' };
export const revalidate = 60;

export default async function UploadPage() {
  const { settings: s, services } = await getSite();
  return (
    <>
      <header className="top"><div className="wrap bar"><a className="brand" href="/">{s.business_name}</a><a className="btn alt sm" href="/">Back to the website</a></div></header>
      <main className="wrap" style={{ padding: '3rem 1.25rem 5rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: '.5rem' }}>Send us your documents</h1>
        <p className="intro">Upload your ID, KRA PIN certificate, payslips or records here instead of sending them over chat. Files are stored privately and only our office team can open them. [Add how long you keep documents.]</p>
        <UploadForm topics={services.map((v) => v.title)} />
      </main>
    </>
  );
}
