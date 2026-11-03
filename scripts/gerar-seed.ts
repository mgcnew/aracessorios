// Gera supabase/seed.sql a partir do catálogo fictício do protótipo (src/data/catalog.ts).
// Uso: node scripts/gerar-seed.ts
// Os dados são de demonstração: nada aqui é produto, preço ou estoque real da cliente.

import { writeFileSync } from 'node:fs';
import { DEMO_CATEGORIES as CATEGORIES, PRODUCTS, productById } from '../src/data/demo-catalog.ts';
import type { Product } from '../src/data/catalog.ts';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const KIND: Record<Product['kind'], string> = {
  simple: 'simples',
  kit_stocked: 'kit_estoque_proprio',
  kit_composed: 'kit_composto',
};

// Nomes dos grupos do protótipo → chaves aceitas pelo banco (D-011, CAT-DEC-022).
const ATTR: Record<string, string> = {
  Banho: 'banho',
  Tamanho: 'tamanho',
  Comprimento: 'tamanho',
  Aro: 'tamanho',
  Diâmetro: 'tamanho',
  Modelo: 'modelo',
};

// Saldos de demonstração: os do protótipo quando existem; 5 nas demais variações disponíveis.
const SALDO_PROTOTIPO: Record<string, number> = { p1: 6, p3: 12, p4: 3 };
const PROMO_INICIO = '2026-11-01 00:00:00-03';
const PROMO_FIM = '2026-11-15 23:59:59-03';

const out: string[] = [];
out.push('-- Gerado por scripts/gerar-seed.ts. Não edite à mão.');
out.push('-- Catálogo de DEMONSTRAÇÃO: produtos, preços e estoques fictícios.');
out.push('begin;');
out.push(`do $$ begin
  if exists (select 1 from public.products) then
    raise exception 'O banco já tem produtos: carga de demonstração não aplicada';
  end if;
end $$;`);

const rows = (r: string[]) => r.join(',\n  ');

out.push('\n-- Categorias');
out.push(`insert into public.categories (slug, name, position) values\n  ${rows(CATEGORIES.map((c, i) => `(${q(c.id)}, ${q(c.name)}, ${i})`))};`);

out.push('\n-- Produtos');
out.push(
  `insert into public.products (slug, name, short_description, description, material, status, kind, sale_unit, is_new, is_featured) values\n  ${rows(
    PRODUCTS.map((p) => `(${[q(p.slug), q(p.name), q(p.short ?? ''), q(p.desc), q(p.material), "'ativo'", `${q(KIND[p.kind])}::public.product_kind`, `${q(p.unit)}::public.sale_unit`, p.isNew, p.best].join(', ')})`),
  )};`,
);

out.push('\n-- Produto × categoria');
out.push(
  `insert into public.product_categories (product_id, category_id)\nselect p.id, c.id from (values\n  ${rows(PRODUCTS.flatMap((p) => p.catIds.map((c) => `(${q(p.slug)}, ${q(c)})`)))}\n) as x(produto, categoria)\njoin public.products p on p.slug = x.produto\njoin public.categories c on c.slug = x.categoria;`,
);

out.push('\n-- Variações. No protótipo, "compare" era o preço "de"; aqui vira preço normal + promocional.');
const variantes = PRODUCTS.flatMap((p) =>
  p.variants.map((v, i) => {
    const attrs = Object.fromEntries(p.groups.map((g, gi) => [ATTR[g.name], v.vals[gi]]));
    const [price, promo] = v.compare ? [v.compare, v.price] : [v.price, null];
    return `(${q(p.slug)}, ${q(v.sku)}, ${q(JSON.stringify(attrs))}, ${price}, ${promo ?? 'null'}, ${i})`;
  }),
);
out.push(
  `insert into public.product_variants (product_id, sku, attributes, price_cents, promo_price_cents, promo_starts_at, promo_ends_at, min_stock, position)\n` +
    `select p.id, x.sku, x.attrs::jsonb, x.preco, x.promo,\n` +
    `  case when x.promo is not null then ${q(PROMO_INICIO)}::timestamptz end,\n` +
    `  case when x.promo is not null then ${q(PROMO_FIM)}::timestamptz end,\n` +
    `  2, x.pos\nfrom (values\n  ${rows(variantes)}\n) as x(produto, sku, attrs, preco, promo, pos)\njoin public.products p on p.slug = x.produto;`,
);

out.push('\n-- Peças dos kits compostos (primeira variação de cada peça)');
const pecas = PRODUCTS.filter((x) => x.kind === 'kit_composed').flatMap((p) =>
  (p.comps ?? []).map((c) => `(${q(p.variants[0].sku)}, ${q(productById[c.ref].variants[0].sku)}, ${c.qty})`),
);
out.push(
  `insert into public.kit_components (kit_variant_id, component_variant_id, quantity)\nselect k.id, c.id, x.qtd from (values\n  ${rows(pecas)}\n) as x(kit, peca, qtd)\njoin public.product_variants k on k.sku = x.kit\njoin public.product_variants c on c.sku = x.peca;`,
);

out.push('\n-- Estoque inicial, com histórico');
const saldos = PRODUCTS.filter((x) => x.kind !== 'kit_composed').flatMap((p) =>
  p.variants
    .map((v) => [v.sku, !v.avail ? 0 : p.kind === 'kit_stocked' ? (p.kitStock ?? 0) : (SALDO_PROTOTIPO[p.id] ?? 5)] as const)
    .filter(([, qtd]) => qtd > 0)
    .map(([sku, qtd]) => `(${q(sku)}, ${qtd})`),
);
out.push(`create temporary table carga_saldo (sku text primary key, qtd integer) on commit drop;`);
out.push(`insert into carga_saldo values\n  ${rows(saldos)};`);
out.push(
  `update public.inventory_balances b set on_hand = s.qtd\nfrom carga_saldo s join public.product_variants v on v.sku = s.sku where b.variant_id = v.id;`,
);
out.push(
  `insert into public.inventory_movements (variant_id, type, on_hand_delta, on_hand_after, reason)\nselect v.id, 'entrada', s.qtd, s.qtd, 'Carga inicial de demonstração'\nfrom carga_saldo s join public.product_variants v on v.sku = s.sku;`,
);

out.push('commit;');
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out.join('\n') + '\n');
console.log(`supabase/seed.sql: ${CATEGORIES.length} categorias, ${PRODUCTS.length} produtos, ${PRODUCTS.reduce((s, p) => s + p.variants.length, 0)} variações`);
