import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import type { ReactNode } from 'react';
import { RegistrarSW } from '../components/RegistrarSW';
import '../styles/base.css';
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
  // PWA da loja: instalável na tela inicial (o painel tem o próprio manifesto em src/app/admin/layout.tsx).
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/loja-192.png', apple: '/icons/loja-180.png' },
  appleWebApp: { capable: true, title: 'AR Acessórios', statusBarStyle: 'default' },
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Cor da barra do navegador no celular, conforme o tema do sistema.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDF6F0' },
    { media: '(prefers-color-scheme: dark)', color: '#100E0D' },
  ],
};

// Aplica o tema antes da primeira pintura: sem piscar claro no modo noturno, e com
// `color-scheme` certo para tudo que o navegador desenha (menus, calendário, rolagem).
// Mesma regra de `aplicarTema` em src/store.tsx.
const TEMA_INICIAL = `(function(){try{var t=localStorage.getItem('ar_demo_theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';if(t)document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',d?'#100E0D':'#FDF6F0');m.removeAttribute('media')})}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body>
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
