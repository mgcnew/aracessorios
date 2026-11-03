import type { ReactNode } from 'react';
import { StoreLayout } from '../../components/StoreLayout';
import { CatalogoProvider } from '../../data/CatalogoContext';
import { getCatalogo } from '../../data/loja';
import { StoreProvider } from '../../store';

// Estoque e preços mudam pelo painel: a vitrine é montada a cada visita, sempre com os dados atuais.
export const dynamic = 'force-dynamic';

export default async function LojaLayout({ children }: { children: ReactNode }) {
  const catalogo = await getCatalogo();
  return (
    <CatalogoProvider catalogo={catalogo}>
      <StoreProvider>
        <StoreLayout>{children}</StoreLayout>
      </StoreProvider>
    </CatalogoProvider>
  );
}
