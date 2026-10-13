import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { getSite } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getSite();
  return {
    title: `${s.business_name} | KRA and tax services in ${s.city}`,
    description: `${s.business_name} helps individuals and businesses in Eldoret with KRA PIN registration, tax returns, VAT, PAYE and eTIMS invoicing.`,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
