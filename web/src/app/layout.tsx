import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAT Fiscal Toolkit — Auditoría y Determinación de Impuestos',
  description: 'Herramienta client-side de auditoría contable y determinación provisional de ISR e IVA para personas físicas en México (CFDI 4.0 / Flujo de Efectivo / Art. 106 LISR).',
  verification: {
    google: 'google7d4ec8c5344a17de',
    other: {
      'msvalidate.01': ['856757614FFC2C5582FBCB81B1B4E4CA'],
    },
  },
  authors: [{ name: 'Lenin Meza', url: 'https://merolhack.github.io/' }],
  creator: 'Lenin Meza (merolhack)',
  publisher: 'FreelanceMexico',
  metadataBase: new URL('https://merolhack.github.io/sat-fiscal-toolkit/'),
  alternates: {
    canonical: 'https://merolhack.github.io/sat-fiscal-toolkit/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Google Analytics 4 (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8STYZ8GZRJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8STYZ8GZRJ', {
              anonymize_ip: true,
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
