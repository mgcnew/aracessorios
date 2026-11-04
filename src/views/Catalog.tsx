'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CrossIcon, FilterIcon, SearchIcon } from '../components/Icons';
import { Selecao } from '../components/Selecao';
import { ProductGrid } from '../components/ProductCard';
import { EmptyState, PageHead } from '../components/ui';
import { useCatalogo } from '../data/CatalogoContext';
import type { CategoryId } from '../data/catalog';
import { catalogHref, countInCategory, filterProducts, readQuery, SORTS, type CatalogQuery } from '../data/catalogQuery';

/** Catálogo: categoria vem do caminho (/loja/brincos); busca, ordem e disponibilidade, do endereço. */
export function Catalog({ cat }: { cat: CategoryId | 'all' }) {
  const router = useRouter();
  const params = useSearchParams();
  const { categories, products } = useCatalogo();
  const CAT_OPTIONS: { id: CategoryId | 'all'; name: string }[] = [{ id: 'all', name: 'Todas' }, ...categories];
  const query = readQuery(cat, new URLSearchParams(params.toString()));
  const [filterOpen, setFilterOpen] = useState(false);
  // A busca digitada responde na hora; o endereço é atualizado logo em seguida.
  const [q, setQ] = useState(query.q);
  useEffect(() => setQ(query.q), [query.q]);

  const go = (patch: Partial<CatalogQuery>) => router.replace(catalogHref({ ...query, ...patch }), { scroll: false });
  const clearFilters = () => {
    setQ('');
    setFilterOpen(false);
    router.replace('/loja', { scroll: false });
  };

  const results = filterProducts(products, { ...query, q });
  const title = cat === 'all' ? 'Todas as peças' : (categories.find((c) => c.id === cat)?.name ?? 'Loja');

  // Filtros ativos viram etiquetas que se removem com um clique.
  const ativos: { chave: string; rotulo: string; remover: () => void }[] = [];
  if (cat !== 'all') ativos.push({ chave: 'cat', rotulo: title, remover: () => go({ cat: 'all' }) });
  if (q.trim()) {
    ativos.push({
      chave: 'q',
      rotulo: `Busca: “${q.trim()}”`,
      remover: () => {
        setQ('');
        go({ q: '' });
      },
    });
  }
  if (query.onlyAvail) ativos.push({ chave: 'disp', rotulo: 'Somente disponíveis', remover: () => go({ onlyAvail: false }) });
  const contagem = (n: number) => (n === 1 ? '1 peça' : `${n} peças`);

  return (
    <div className="wrap fade">
      <PageHead title={title}>
        <p role="status">
          {ativos.length > 0 && results.length !== products.length ? `${results.length} de ${contagem(products.length)}` : contagem(results.length)}
        </p>
      </PageHead>

      <div className="chips" role="group" aria-label="Categorias">
        {CAT_OPTIONS.map((c) => (
          <button key={c.id} className={`pill${cat === c.id ? ' on' : ''}`} aria-pressed={cat === c.id} onClick={() => go({ cat: c.id })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="cat-layout">
        <aside>
          {filterOpen && <button className="scrim" onClick={() => setFilterOpen(false)} aria-label="Fechar filtros" />}
          <div className={`filters${filterOpen ? ' open' : ''}`} role="group" aria-label="Filtros">
            <div className="fgroup">
              <h3>Categorias</h3>
              {CAT_OPTIONS.map((c) => (
                <label key={c.id} className="opt">
                  <input type="radio" name="fcat" checked={cat === c.id} onChange={() => go({ cat: c.id })} />
                  <span>{c.name}</span>
                  <small>{countInCategory(products, c.id)}</small>
                </label>
              ))}
            </div>
            <div className="fgroup">
              <h3>Disponibilidade</h3>
              <label className="opt">
                <input type="checkbox" checked={query.onlyAvail} onChange={() => go({ onlyAvail: !query.onlyAvail })} />
                <span>Somente disponíveis</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="lnk" onClick={clearFilters}>
                Limpar filtros
              </button>
              <button className="btn btn-p sheet-only" onClick={() => setFilterOpen(false)} style={{ flex: 1 }}>
                Ver {results.length} peças
              </button>
            </div>
          </div>
        </aside>

        <div>
          <div className="toolbar">
            <label className="fld">
              <SearchIcon />
              <input
                type="search"
                placeholder="Buscar por nome ou categoria"
                aria-label="Buscar produtos"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  go({ q: e.target.value });
                }}
              />
            </label>
            <button className="fbtn" onClick={() => setFilterOpen(true)}>
              <FilterIcon />
              Filtros
            </button>
            <Selecao className="sel" aria-label="Ordenar por" value={query.sort} opcoes={SORTS} onChange={(v) => go({ sort: v })} />
          </div>

          {ativos.length > 0 && (
            <div className="fchips" role="group" aria-label="Filtros ativos">
              {ativos.map((a) => (
                <button key={a.chave} className="fchip" onClick={a.remover} aria-label={`Remover filtro: ${a.rotulo}`}>
                  <span>{a.rotulo}</span>
                  <i aria-hidden="true">
                    <CrossIcon size={12} />
                  </i>
                </button>
              ))}
              {ativos.length > 1 && (
                <button className="lnk" onClick={clearFilters}>
                  Limpar tudo
                </button>
              )}
            </div>
          )}

          {results.length > 0 ? (
            <ProductGrid products={results} three />
          ) : (
            <EmptyState
              title="Nenhuma peça encontrada"
              text="Não encontramos resultados para essa combinação. Tente outro termo ou limpe os filtros."
              action={
                <button className="btn btn-p" onClick={clearFilters}>
                  Limpar filtros
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
