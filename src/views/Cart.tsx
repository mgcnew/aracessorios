'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Midia } from '../components/Midia';
import { BagIcon, TrashIcon } from '../components/Icons';
import { EmptyState, PageHead, Stepper } from '../components/ui';
import { useCatalogo } from '../data/CatalogoContext';
import { artOf, fmt, type ArtProps, type Product, type Variant } from '../data/catalog';
import { MAX_QTY, useStore, type CartLine } from '../store';

interface ResolvedLine {
  line: CartLine;
  product: Product;
  variant: Variant;
  art: ArtProps;
  total: number;
}

/** Itens da sacola com produto, variante e totais resolvidos. */
function useCartLines() {
  const { cart } = useStore();
  const { byId } = useCatalogo();
  const lines: ResolvedLine[] = [];
  for (const line of cart) {
    const product = byId[line.pid];
    const variant = product?.variants.find((v) => v.key === line.vkey);
    if (product && variant) lines.push({ line, product, variant, art: artOf(product, variant), total: variant.price * line.qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const itemCount = lines.reduce((s, l) => s + l.line.qty, 0);
  return { lines, subtotal, itemCount };
}

const exploreLink = (
  <Link className="btn btn-p" href="/loja">
    Explorar a loja
  </Link>
);

export function Cart() {
  const { setLineQty, removeLine } = useStore();
  const { lines, subtotal, itemCount } = useCartLines();

  return (
    <div className="wrap fade">
      <PageHead eyebrow="Sua sacola" title="Sacola" />
      {lines.length > 0 ? (
        <div className="cart-l">
          <div>
            {lines.map(({ line, product, variant, art, total }) => {
              const href = `/produto/${product.slug}`;
              return (
                <div key={line.key} className="line">
                  <Link className="line-i" href={href} aria-label={`Ver ${product.name}`} tabIndex={-1}>
                    <Midia foto={product.photos?.[0]} art={art} />
                  </Link>
                  <div className="line-b">
                    <Link className="line-n" href={href}>
                      {product.name}
                    </Link>
                    <span className="line-v">
                      {variant.label} · {fmt(variant.price)}
                    </span>
                    <span className="line-s">SKU {variant.sku}</span>
                    <div className="line-f">
                      <Stepper
                        label={`Quantidade de ${product.name}`}
                        value={line.qty}
                        onDec={() => (line.qty <= 1 ? removeLine(line.key) : setLineQty(line.key, line.qty - 1))}
                        onInc={() => setLineQty(line.key, line.qty + 1)}
                        incDisabled={line.qty >= MAX_QTY}
                      />
                      <strong style={{ fontWeight: 500 }}>{fmt(total)}</strong>
                    </div>
                    <button className="rm" onClick={() => removeLine(line.key)} aria-label={`Remover ${product.name} da sacola`}>
                      <TrashIcon />
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="sum" aria-label="Resumo da sacola">
            <h2>Resumo</h2>
            <div className="row">
              <span>
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
              </span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="row mut">
              <span>Frete</span>
              <span>Não calculado na demonstração</span>
            </div>
            <div className="row tot">
              <span>Total ilustrativo</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <p className="note">Valores ilustrativos para apresentação. Nenhuma compra é realizada.</p>
            <Link className="btn btn-p" href="/checkout" style={{ marginTop: 6 }}>
              Ver prévia do checkout
            </Link>
            <Link className="btn btn-s" href="/loja">
              Continuar explorando
            </Link>
          </aside>
        </div>
      ) : (
        <EmptyState
          style={{ marginBottom: 60 }}
          icon={<BagIcon size={40} strokeWidth={1.3} style={{ color: 'var(--acc)' }} />}
          title="Sua sacola está vazia"
          text="Escolha uma peça na loja para ver como a sacola funciona nesta demonstração."
          action={exploreLink}
        />
      )}
    </div>
  );
}

const PAY_OPTIONS = [
  { id: 'pix', title: 'Pix', desc: 'Possibilidade prevista para a versão final — sem QR code ou cobrança nesta demonstração.' },
  { id: 'credit', title: 'Cartão de crédito', desc: 'Parcelamento em até 6x poderá ser oferecido na versão final. Nenhum dado de cartão é solicitado.' },
  { id: 'debit', title: 'Cartão de débito', desc: 'Possibilidade prevista para a versão final. Nenhum dado de cartão é solicitado.' },
];

const DEMO_ADDRESS = [
  { id: 'c-n', label: 'Nome', value: 'Maria Exemplo' },
  { id: 'c-c', label: 'CEP', value: '00000-000' },
  { id: 'c-r', label: 'Endereço', value: 'Rua das Flores, 123 — Jardim Exemplo', full: true },
  { id: 'c-ci', label: 'Cidade / UF', value: 'São Paulo / SP' },
];

export function Checkout() {
  const { lines, subtotal } = useCartLines();
  const [pay, setPay] = useState('pix');

  return (
    <>
      <div className="demo-strong" role="note">
        Demonstração — nenhuma compra ou pagamento será realizado
      </div>
      <div className="wrap fade">
        <PageHead eyebrow="Prévia não operacional" title="Checkout" />
        {lines.length > 0 ? (
          <div className="cart-l">
            <div>
              <section className="card" aria-labelledby="h-end">
                <h2 id="h-end">1 · Endereço de entrega</h2>
                <p className="note">Exemplo fictício, apenas para apresentação. Nenhum dado é coletado.</p>
                <div className="fgrid">
                  {DEMO_ADDRESS.map((f) => (
                    <div key={f.id} className="fl" style={f.full ? { gridColumn: '1 / -1' } : undefined}>
                      <label htmlFor={f.id}>{f.label}</label>
                      <input id={f.id} value={f.value} readOnly tabIndex={-1} />
                    </div>
                  ))}
                </div>
              </section>
              <section className="card" aria-labelledby="h-env">
                <h2 id="h-env">2 · Entrega</h2>
                <p className="note">O cálculo de frete não está disponível nesta demonstração.</p>
              </section>
              <section className="card" aria-labelledby="h-pag">
                <h2 id="h-pag">3 · Pagamento</h2>
                <p className="note">Possibilidades previstas para a versão final. Nenhuma cobrança é simulada.</p>
                <div className="pay" role="radiogroup" aria-label="Forma de pagamento">
                  {PAY_OPTIONS.map((o) => (
                    <label key={o.id} className="payo">
                      <input type="radio" name="pay" checked={pay === o.id} onChange={() => setPay(o.id)} />
                      <div>
                        <b>{o.title}</b>
                        <span>{o.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            <aside className="sum" aria-label="Resumo do pedido de demonstração">
              <h2>Resumo</h2>
              {lines.map(({ line, product, variant, art, total }) => (
                <div key={line.key} className="mini">
                  <div className="line-i">
                    <Midia foto={product.photos?.[0]} art={art} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{product.name}</div>
                    <div className="line-v">
                      {variant.label} · {line.qty} un.
                    </div>
                  </div>
                  <span>{fmt(total)}</span>
                </div>
              ))}
              <div className="row" style={{ marginTop: 6 }}>
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="row mut">
                <span>Frete</span>
                <span>Não calculado</span>
              </div>
              <div className="row tot">
                <span>Total ilustrativo</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <button className="btn btn-p" disabled aria-disabled="true" style={{ marginTop: 6 }}>
                Compras indisponíveis nesta demonstração
              </button>
              <Link className="lnk" href="/sacola">
                Voltar à sacola
              </Link>
            </aside>
          </div>
        ) : (
          <EmptyState
            style={{ marginBottom: 60 }}
            title="Nada para visualizar"
            text="Adicione peças à sacola para ver a prévia do checkout de demonstração."
            action={exploreLink}
          />
        )}
      </div>
    </>
  );
}
