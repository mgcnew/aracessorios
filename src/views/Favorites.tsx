'use client';

import Link from 'next/link';
import { HeartIcon } from '../components/Icons';
import { ProductGrid } from '../components/ProductCard';
import { EmptyState, PageHead } from '../components/ui';
import { useCatalogo } from '../data/CatalogoContext';
import { useStore } from '../store';

export function Favorites() {
  const { favs, clearDemo } = useStore();
  const { byId } = useCatalogo();
  const items = favs.map((id) => byId[id]).filter(Boolean);
  const label =
    items.length === 0 ? 'Você ainda não marcou nenhuma peça' : items.length === 1 ? '1 peça salva' : `${items.length} peças salvas`;

  return (
    <div className="wrap fade" style={{ paddingBottom: 60 }}>
      <PageHead title="Favoritos">
        <p role="status">{label}</p>
      </PageHead>
      {items.length > 0 ? (
        <>
          <ProductGrid products={items} />
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button className="lnk" onClick={clearDemo} style={{ color: 'var(--ink2)', fontSize: 13.5 }}>
              Limpar sacola e favoritos deste aparelho
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<HeartIcon size={40} strokeWidth={1.3} style={{ color: 'var(--acc)' }} />}
          title="Nenhum favorito ainda"
          text="Toque no coração de uma peça para guardá-la aqui e encontrá-la depois."
          action={
            <Link className="btn btn-p" href="/loja">
              Explorar a loja
            </Link>
          }
        />
      )}
    </div>
  );
}
