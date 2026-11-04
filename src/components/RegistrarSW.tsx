'use client';

import { useEffect } from 'react';

/** Registra o service worker (/sw.js): PWA da loja e do painel e avisos push. Falha em silêncio. */
export function RegistrarSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
