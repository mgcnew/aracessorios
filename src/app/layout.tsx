import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import type { ReactNode } from 'react';
import '../styles/store.css';
import '../styles/admin.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Jost({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'AR Acessórios — semijoias', template: '%s · AR Acessórios' },
  description: 'Semijoias delicadas para o dia a dia e para presentear.',
  // Protótipo com dados fictícios: fora dos buscadores até o lançamento.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FDF6F0',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
