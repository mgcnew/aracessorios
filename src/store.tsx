'use client';

import { usePathname } from 'next/navigation';
import type { ArtProps, Foto } from './data/catalog';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

export interface CartLine {
  key: string;
  pid: string;
  vkey: string;
  qty: number;
}

export const MAX_QTY = 10;
const DATA_KEY = 'ar_demo_v1';
const THEME_KEY = 'ar_demo_theme';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* armazenamento indisponível (aba anônima, bloqueio do navegador) */
  }
}

/*
 * Tema claro/noturno compartilhado entre loja e painel. Mora na classe `dark` do <html>,
 * posta antes da primeira pintura pelo script de src/app/layout.tsx; o CSS lê dali.
 */
const ouvintesTema = new Set<() => void>();
const lerTema = () => document.documentElement.classList.contains('dark');
const assinarTema = (f: () => void) => {
  ouvintesTema.add(f);
  return () => ouvintesTema.delete(f);
};

function aplicarTema(dark: boolean) {
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', dark);
  raiz.style.colorScheme = dark ? 'dark' : 'light';
  // A barra do navegador no celular segue o tema escolhido, não só o do aparelho.
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute('content', dark ? '#100E0D' : '#FDF6F0');
    m.removeAttribute('media');
  });
  ouvintesTema.forEach((f) => f());
}

export function useTheme() {
  const dark = useSyncExternalStore(assinarTema, lerTema, () => false);
  const toggleDark = useCallback(() => {
    const novo = !lerTema();
    write(THEME_KEY, novo ? 'dark' : 'light');
    aplicarTema(novo);
  }, []);
  return { dark, toggleDark };
}

/** O balão que aparece depois de uma ação (ex.: peça na sacola). */
export interface Aviso {
  titulo: string;
  detalhe?: string;
  /** Miniatura da peça: foto, ou a ilustração quando ainda não há foto. */
  foto?: Foto | null;
  art?: ArtProps;
  acao?: { rotulo: string; href: string };
}
export interface AvisoAtivo extends Aviso {
  /** Muda a cada aviso, para a animação de entrada recomeçar quando dois seguem juntos. */
  id: number;
  saindo: boolean;
}

interface StoreValue {
  favs: string[];
  cart: CartLine[];
  toggleFav: (id: string) => void;
  addToCart: (pid: string, vkey: string, qty: number) => void;
  setLineQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearDemo: () => void;
  toast: AvisoAtivo | null;
  showToast: (aviso: Aviso | string) => void;
  /** Segura o aviso enquanto o mouse ou o foco estão nele; `soltarToast` retoma a contagem. */
  segurarToast: () => void;
  soltarToast: () => void;
  fecharToast: () => void;
  dark: boolean;
  toggleDark: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favs, setFavs] = useState<string[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  // Só grava no navegador depois de ler o que já estava salvo, para não apagar a sacola.
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<AvisoAtivo | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const { dark, toggleDark } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const d = readJSON<{ favs?: unknown; cart?: unknown }>(DATA_KEY, {});
    if (Array.isArray(d.favs)) setFavs(d.favs as string[]);
    if (Array.isArray(d.cart)) setCart(d.cart as CartLine[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) write(DATA_KEY, JSON.stringify({ favs, cart }));
  }, [loaded, favs, cart]);

  // Trocar de página dispensa o aviso.
  useEffect(() => setToast(null), [pathname]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Some em duas etapas: marca "saindo" (a transição de saída roda) e só depois tira da tela.
  const iniciarSaida = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast((t) => (t ? { ...t, saindo: true } : t));
    timer.current = window.setTimeout(() => setToast(null), 220);
  }, []);
  const agendar = useCallback(
    (ms: number) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(iniciarSaida, ms);
    },
    [iniciarSaida],
  );
  const showToast = useCallback(
    (aviso: Aviso | string) => {
      const a = typeof aviso === 'string' ? { titulo: aviso } : aviso;
      setToast({ ...a, id: Date.now(), saindo: false });
      agendar(4500);
    },
    [agendar],
  );
  const segurarToast = useCallback(() => window.clearTimeout(timer.current), []);
  const soltarToast = useCallback(() => agendar(2500), [agendar]);
  const fecharToast = iniciarSaida;

  const value = useMemo<StoreValue>(
    () => ({
      favs,
      cart,
      toggleFav: (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
      addToCart: (pid, vkey, qty) =>
        setCart((c) => {
          const key = `${pid}|${vkey}`;
          return c.some((l) => l.key === key)
            ? c.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
            : [...c, { key, pid, vkey, qty }];
        }),
      setLineQty: (key, qty) =>
        setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l))),
      removeLine: (key) => setCart((c) => c.filter((l) => l.key !== key)),
      clearDemo: () => {
        setFavs([]);
        setCart([]);
        setToast(null);
      },
      toast,
      showToast,
      segurarToast,
      soltarToast,
      fecharToast,
      dark,
      toggleDark,
    }),
    [favs, cart, toast, showToast, segurarToast, soltarToast, fecharToast, dark, toggleDark],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
