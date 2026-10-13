import { getSite, isSet, toIntl } from '@/lib/site';
import { EnquiryForm } from './enquiry-form';

export const revalidate = 60;

const BRING = [
  'National ID or passport',
  'Your KRA PIN certificate, or tell us and we will help you get one',
  'Income records such as your P9 form or payslips',
  'Business receipts and records, if you run a business',
  "Last year's return acknowledgement, if you have it",
];
const STEPS = [
  ['Tell us what you need', 'Message, call or walk in. We will tell you what we need from you.'],
  ['Share your documents', 'Bring or send your records. We prepare the work and explain it in plain language.'],
  ['You approve, we file', 'Nothing is submitted until you have checked it. You keep a copy of every acknowledgement.'],
];

export default async function Home() {
  const { settings: s, services, faqs } = await getSite();
  const wa = isSet(s.whatsapp) && toIntl(s.whatsapp).length >= 11
    ? `https://wa.me/${toIntl(s.whatsapp)}?text=${encodeURIComponent(`Hello ${s.business_name}, I need help with KRA or tax services.`)}`
    : null;
  const tel = isSet(s.phone_tel) ? `tel:${s.phone_tel}` : '#contact';
  const waProps = wa ? { href: wa, target: '_blank', rel: 'noopener' } : { href: '#contact' };

  return (
    <>
      <header className="top">
        <div className="wrap bar">
          <a className="brand" href="#top">{s.business_name}</a>
          <nav aria-label="Main">
            <span className="links" style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#services">Services</a><a href="#steps">How it works</a><a href="#about">About</a><a href="#faq">FAQ</a><a href="/upload">Send documents</a><a href="#contact">Contact</a>
            </span>
            <a className="btn" href="/book">Book a visit</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="wrap">
            <div>
              <h1>{s.tagline}</h1>
              <p className="lead">From PIN registration to tax returns and eTIMS invoicing, we help individuals and businesses keep their tax affairs in order.</p>
              <div className="cta">
                <a className="btn" href="/book">Book an appointment</a>
                <a className="btn alt" {...waProps}>Message us on WhatsApp</a>
                <a className="btn alt" href={tel}>Call the office</a>
              </div>
            </div>
            <aside className="slip" aria-label="What to bring">
              <h2>What to bring when you visit</h2>
              <p className="sub">Not sure what you need? Start with this list.</p>
              <ul>{BRING.map((b) => <li key={b}>{b}</li>)}</ul>
              <div className="stamp" aria-hidden="true">{s.business_name.toUpperCase()}<br />{s.city.toUpperCase()}</div>
            </aside>
          </div>
        </section>

        <section id="services" className="alt-bg">
          <div className="wrap">
            <h2 className="title">What we help with</h2>
            <p className="intro">Ask if what you need is not listed. We will tell you if we can help.</p>
            <ul className="rows">{services.map((v) => <li key={v.id}><h3>{v.title}</h3><p>{v.description}</p></li>)}</ul>
          </div>
        </section>

        <section id="steps">
          <div className="wrap">
            <h2 className="title">How it works</h2>
            <p className="intro">Three steps, and you stay in control throughout.</p>
            <ol className="steps">{STEPS.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}</ol>
          </div>
        </section>

        <section id="about" className="alt-bg">
          <div className="wrap about">
            <div><h2 className="title">About {s.business_name}</h2></div>
            <div>{(s.about ?? '').split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
          </div>
        </section>

        <section id="faq">
          <div className="wrap">
            <h2 className="title">Questions people ask us</h2>
            <p className="intro">Short answers. Rules and deadlines change, so we confirm current requirements for your situation.</p>
            <div className="faq">{faqs.map((f) => <details key={f.id}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div>
          </div>
        </section>

        <section id="contact" className="alt-bg">
          <div className="wrap contact">
            <div>
              <h2 className="title">Visit or contact us</h2>
              <dl>
                <dt>Phone and WhatsApp</dt><dd><a href={tel}>{s.phone_display}</a></dd>
                <dt>Email</dt><dd>{isSet(s.email) ? <a href={`mailto:${s.email}`}>{s.email}</a> : s.email}</dd>
                <dt>Office</dt>
                <dd>{s.address}<br /><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.city)}`} target="_blank" rel="noopener">Open in Google Maps</a></dd>
                <dt>Opening hours</dt><dd>{s.hours}</dd>
                <dt>Documents</dt><dd><a href="/upload">Send documents securely</a></dd>
              </dl>
            </div>
            <EnquiryForm services={services.map((v) => v.title)} />
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>&copy; {new Date().getFullYear()} {s.business_name}, {s.city}.</p>
          <p>Information on this site is general guidance, not legal or tax advice for your specific case.</p>
          <p>{s.business_name} is an independent service provider. It is not part of, or endorsed by, the Kenya Revenue Authority (KRA).</p>
        </div>
      </footer>
    </>
  );
}
