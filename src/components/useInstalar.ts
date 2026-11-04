'use client';

import { useCallback, useEffect, useState } from 'react';
import { ehIos, estaInstalado } from '../lib/pwa';

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Instalar como aplicativo. Android e computador (Chrome/Edge) oferecem o botão nativo (`podeInstalar`);
 * o iPhone não tem botão, então só dá para mostrar o passo a passo (`ios`).
 */
export function useInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [ios, setIos] = useState(false);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    setIos(ehIos());
    setInstalado(estaInstalado());
    const antes = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const depois = () => {
      setEvento(null);
      setInstalado(true);
    };
    window.addEventListener('beforeinstallprompt', antes);
    window.addEventListener('appinstalled', depois);
    return () => {
      window.removeEventListener('beforeinstallprompt', antes);
      window.removeEventListener('appinstalled', depois);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }, [evento]);

  return { podeInstalar: evento !== null && !instalado, ios: ios && !instalado, instalado, instalar };
}
