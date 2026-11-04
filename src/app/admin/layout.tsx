import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// O painel pode ser instalado na tela inicial (necessário para receber avisos no iPhone, iOS 16.4+).
export const metadata: Metadata = {
  manifest: '/admin.webmanifest',
  icons: { icon: '/icons/painel-192.png', apple: '/icons/painel-180.png' },
  appleWebApp: { capable: true, title: 'Painel AR', statusBarStyle: 'default' },
  // Safari de iPhone mais antigo só reconhece esta marca (a padrão é mobile-web-app-capable).
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
