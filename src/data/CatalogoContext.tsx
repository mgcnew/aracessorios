'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Category, Product } from './catalog';
import type { Catalogo } from './loja';

interface CatalogoValue {
  categories: Category[];
  products: Product[];
  byId: Record<string, Product>;
  bySlug: Record<string, Product>;
}

const Ctx = createContext<CatalogoValue | null>(null);

/** Entrega aos componentes da loja o catálogo carregado do banco pelo servidor. */
export function CatalogoProvider({ catalogo, children }: { catalogo: Catalogo; children: ReactNode }) {
  const value = useMemo<CatalogoValue>(
    () => ({
      ...catalogo,
      byId: Object.fromEntries(catalogo.products.map((p) => [p.id, p])),
      bySlug: Object.fromEntries(catalogo.products.map((p) => [p.slug, p])),
    }),
    [catalogo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCatalogo precisa estar dentro de <CatalogoProvider>');
  return ctx;
}
