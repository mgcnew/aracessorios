import type { ReactNode } from 'react';
import { StoreLayout } from '../../components/StoreLayout';
import { CatalogoProvider } from '../../data/CatalogoContext';
import { getCatalogo } from '../../data/loja';
import { EmpresaProvider } from '../../data/SiteContext';
import { getSite } from '../../data/site';
import { StoreProvider } from '../../store';

// Estoque e preços mudam pelo painel: a vitrine é montada a cada visita, sempre com os dados atuais.
export const dynamic = 'force-dynamic';

export default async function LojaLayout({ children }: { children: ReactNode }) {
  const [catalogo, site] = await Promise.all([getCatalogo(), getSite()]);
  return (
    <CatalogoProvider catalogo={catalogo}>
      <EmpresaProvider empresa={site.empresa}>
        <StoreProvider>
          <StoreLayout>{children}</StoreLayout>
        </StoreProvider>
      </EmpresaProvider>
    </CatalogoProvider>
  );
}
