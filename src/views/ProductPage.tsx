'use client';

import Link from 'next/link';
import { useRef, useState, type PointerEvent } from 'react';
import { Art } from '../components/Art';
import { Midia } from '../components/Midia';
import { HeartIcon } from '../components/Icons';
import { ProductGrid } from '../components/ProductCard';
import { SectionHead, Stepper } from '../components/ui';
import { useCatalogo } from '../data/CatalogoContext';
import { catalogHref } from '../data/catalogQuery';
import { artOf, categoryLabel, fmt, type Product } from '../data/catalog';
import { INFO_LOJA } from '../data/infoLoja';
import { MAX_QTY, useStore } from '../store';

const GALLERY = [
  { bg: 0, rot: 0 },
  { bg: 1, rot: -9 },
  { bg: 2, rot: 8 },
  { bg: 3, rot: 0 },
];

const KIND_TEXT: Record<Product['kind'], string> = {
  simple: 'Peça avulsa',
  kit_stocked: 'Conjunto',
  kit_composed: 'Conjunto',
};

const UNIT_SHORT: Record<Product['unit'], string> = { par: 'par', unidade: 'un.', conjunto: 'conjunto' };
const FIM_PROMO = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });

function relatedTo(p: Product, all: Product[]): Product[] {
  const sameCat = all.filter((x) => x.id !== p.id && !x.isKit && x.catIds.some((c) => p.catIds.includes(c))).slice(0, 4);
  if (sameCat.length >= 4) return sameCat;
  const rest = all.filter((x) => x.id !== p.id && !x.isKit && !sameCat.includes(x)).slice(0, 4 - sameCat.length);
  return [...sameCat, ...rest];
}

export function ProductPage({ productId }: { productId: string }) {
  const { byId, products } = useCatalogo();
  const p = byId[productId];
  const { favs, toggleFav, addToCart, showToast } = useStore();
  const [sel, setSel] = useState<string[]>(() => (p.variants.find((v) => v.avail) ?? p.variants[0]).vals);
  const [qty, setQty] = useState(1);
  const [gal, setGal] = useState(0);

  const cur = p.variants.find((v) => v.key === sel.join('|')) ?? p.variants[0];
  const isFav = favs.includes(p.id);
  const unitWord = p.unit;
  const art = artOf(p, cur);
  const fotos = p.photos ?? [];
  const total = fotos.length > 0 ? fotos.length : GALLERY.length;
  const faixa = useRef<HTMLDivElement>(null);

  const irPara = (i: number) => {
    setGal(i);
    const el = faixa.current;
    // Troca na hora (miniaturas só existem no computador; no celular quem desliza é o dedo).
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'auto' });
  };
  // Zoom acompanha o mouse (só em telas com mouse; ver .zoomavel no CSS).
  const moverZoom = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const details = [
    { k: 'Material', v: p.material },
    { k: 'Tipo', v: KIND_TEXT[p.kind] },
    { k: 'Unidade', v: `Vendido por ${unitWord}` },
    { k: 'SKU', v: cur.sku },
  ];

  // Blocos que abrem e fecham; só aparecem com texto (cadastro ou src/data/infoLoja.ts).
  const informacoes = [
    { t: 'Cuidados com a peça', x: p.care },
    { t: 'Entrega', x: INFO_LOJA.entrega },
    { t: 'Trocas', x: INFO_LOJA.trocas },
  ].filter((b): b is { t: string; x: string } => !!b.x);

  const add = () => {
    if (!cur.avail) return;
    addToCart(p.id, cur.key, qty);
    showToast('Adicionado à sacola');
  };

  return (
    <div className="wrap fade">
      <nav className="crumbs" aria-label="Você está em">
        <Link href="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link href="/loja">Loja</Link>
        <span aria-hidden="true">/</span>
        {!p.isKit && p.catIds[0] && (
          <>
            <Link href={catalogHref({ cat: p.catIds[0] })}>{categoryLabel(p)}</Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="pdp">
        <div className="gal">
          {/* Celular: desliza com o dedo (pontos embaixo). Computador: miniaturas e zoom ao passar o mouse na foto. */}
          <div
            className="gal-main"
            ref={faixa}
            role="region"
            aria-roledescription="carrossel"
            aria-label={`Imagens de ${p.name}`}
            tabIndex={0}
            onScroll={(e) => {
              const el = e.currentTarget;
              const i = Math.round(el.scrollLeft / el.clientWidth);
              if (i !== gal && i >= 0 && i < total) setGal(i);
            }}
          >
            {fotos.length > 0
              ? fotos.map((f, i) => (
                  <div
                    key={f.src}
                    className="gal-slide zoomavel"
                    role="group"
                    aria-roledescription="imagem"
                    aria-label={`${i + 1} de ${total}`}
                    onPointerMove={moverZoom}
                  >
                    <Midia foto={f} tamanho="g" art={art} ratio="1 / 1.05" prioridade={i === 0} />
                  </div>
                ))
              : GALLERY.map((g, i) => (
                  <div key={i} className="gal-slide" role="group" aria-roledescription="imagem" aria-label={`${i + 1} de ${total}`}>
                    <Art {...art} bg={g.bg} rot={g.rot} ratio="1 / 1.05" />
                  </div>
                ))}
          </div>
          {total > 1 && (
            <>
              <div className="gal-t">
                {(fotos.length > 0 ? fotos : GALLERY).map((item, i) => (
                  <button
                    key={i}
                    className={gal === i ? 'on' : ''}
                    onClick={() => irPara(i)}
                    aria-label={`Ver imagem ${i + 1} de ${total}`}
                    aria-pressed={gal === i}
                  >
                    {'src' in item ? <Midia foto={{ ...item, alt: '' }} art={art} /> : <Art {...art} bg={item.bg} rot={item.rot} />}
                  </button>
                ))}
              </div>
              <div className="gal-pontos" aria-hidden="true">
                {Array.from({ length: total }, (_, i) => (
                  <i key={i} className={gal === i ? 'on' : ''} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="pdp-info">
          <h1>{p.name}</h1>
          <div className="price">
            <strong>{fmt(cur.price)}</strong>
            {cur.compare && cur.avail && <s>{fmt(cur.compare)}</s>}
          </div>
          <p className="note">Preço por {unitWord}</p>
          {cur.compare && cur.avail && cur.promoEnds && (
            <p className="note" style={{ marginTop: 4 }}>
              Promoção válida até {FIM_PROMO.format(new Date(cur.promoEnds))}.
            </p>
          )}
          <p style={{ marginTop: 18, color: 'var(--ink2)', fontSize: 17 }}>{p.desc}</p>

          {p.groups.map((g, gi) => (
            <div key={g.name} className="vg" role="group" aria-label={g.name}>
              <span className="vg-l">
                {g.name}: <b>{sel[gi]}</b>
              </span>
              <div className="pills">
                {g.values.map((v) => {
                  const combo = sel.slice();
                  combo[gi] = v;
                  const vr = p.variants.find((x) => x.key === combo.join('|'));
                  const ok = !!vr?.avail;
                  const on = sel[gi] === v;
                  return (
                    <button
                      key={v}
                      className={`pill${on ? ' on' : ''}${ok ? '' : ' off'}`}
                      aria-pressed={on}
                      aria-label={ok ? `${g.name} ${v}` : `${g.name} ${v} — esgotado nesta combinação`}
                      onClick={() => {
                        setSel(combo);
                        setQty(1);
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <p className={`stat${cur.avail ? '' : ' bad'}`} role="status">
            <i />
            {cur.avail ? 'Disponível' : 'Esgotado nesta combinação'}
          </p>

          <div className="pdp-actions">
            <Stepper
              label="Quantidade"
              value={qty}
              live
              onDec={() => setQty((q) => Math.max(1, q - 1))}
              onInc={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              decDisabled={qty <= 1}
              incDisabled={qty >= MAX_QTY}
            />
            <button className="btn btn-p" onClick={add} disabled={!cur.avail}>
              {cur.avail ? 'Adicionar à sacola' : 'Indisponível'}
            </button>
          </div>

          <button className="favb" onClick={() => toggleFav(p.id)} aria-pressed={isFav}>
            <HeartIcon filled={isFav} />
            {isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          </button>

          {/* Composição do conjunto, sem quantidades em estoque (CAT-DEC-024). */}
          {p.comps && p.comps.length > 0 && (
            <div className="comp">
              <h3>O que vem no conjunto</h3>
              <ul>
                {p.comps.map((c) => (
                  <li key={c.ref}>
                    <span>{c.name}</span>
                    <span>
                      {c.qty} {UNIT_SHORT[c.unit]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="dl">
            {details.map((d) => (
              <div key={d.k} className="dl-row">
                <dt>{d.k}</dt>
                <dd>{d.v}</dd>
              </div>
            ))}
          </dl>

          {informacoes.length > 0 && (
            <div className="acc">
              {informacoes.map((b) => (
                <details key={b.t}>
                  <summary>{b.t}</summary>
                  <p>{b.x}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="sec" style={{ paddingTop: 20 }} aria-labelledby="h-rel">
        <SectionHead title="Você também pode gostar" id="h-rel" />
        <ProductGrid products={relatedTo(p, products)} />
      </section>
    </div>
  );
}
