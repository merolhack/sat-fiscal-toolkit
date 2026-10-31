import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAT Fiscal Toolkit — Auditoría y Determinación de Impuestos',
  description: 'Herramienta client-side de auditoría contable y determinación provisional de ISR e IVA para personas físicas en México (CFDI 4.0 / Flujo de Efectivo / Art. 106 LISR).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

