// Catálogo da vitrine lido do banco e convertido para o formato que as telas usam.
// Só roda no servidor. O visitante recebe disponível sim/não, nunca quantidade (CAT-DEC-024).

import { cache } from 'react';
import { supabasePublico } from '../lib/supabase/public';
import type { Database } from '../lib/database.types';
import { toneOf, type Category, type KitComponent, type Product, type ProductKind, type Variant, type VariantGroup } from './catalog';

export interface Catalogo {
  categories: Category[];
  products: Product[];
}

type Kind = Database['public']['Enums']['product_kind'];
const KIND: Record<Kind, ProductKind> = { simples: 'simple', kit_estoque_proprio: 'kit_stocked', kit_composto: 'kit_composed' };

/** Ordem e rótulo dos atributos de variação (D-011, CAT-DEC-022). */
const ATRIBUTOS = [
  ['banho', 'Banho'],
  ['tamanho', 'Tamanho'],
  ['material', 'Material'],
  ['cor', 'Cor'],
  ['modelo', 'Modelo'],
] as const;

/** Promoção vale só dentro do período cadastrado (CAT-DEC-020). */
function precoAgora(v: { price_cents: number; promo_price_cents: number | null; promo_starts_at: string | null; promo_ends_at: string | null }, agora: number) {
  const valendo =
    v.promo_price_cents !== null &&
    v.promo_starts_at !== null &&
    v.promo_ends_at !== null &&
    Date.parse(v.promo_starts_at) <= agora &&
    agora <= Date.parse(v.promo_ends_at);
  return valendo
    ? { price: v.promo_price_cents!, compare: v.price_cents, promoEnds: v.promo_ends_at }
    : { price: v.price_cents, compare: null, promoEnds: null };
}

function falha(etapa: string, erro: { message: string } | null): never {
  throw new Error(`Não foi possível carregar ${etapa} do banco: ${erro?.message ?? 'erro desconhecido'}`);
}

/** Lê o catálogo uma vez por requisição, mesmo que várias partes da página peçam. */
export const getCatalogo = cache(async (): Promise<Catalogo> => {
  const db = supabasePublico();

  const [cats, prods, kits] = await Promise.all([
    db.from('categories').select('slug, name').order('position'),
    db
      .from('products')
      .select(
        `id, slug, name, short_description, description, material, kind, sale_unit, is_new, is_featured,
         product_categories ( categories ( slug, name, position ) ),
         product_variants ( id, sku, attributes, price_cents, promo_price_cents, promo_starts_at, promo_ends_at, position, active )`,
      )
      .order('name'),
    db.from('kit_components').select('kit_variant_id, component_variant_id, quantity'),
  ]);
  if (cats.error) falha('as categorias', cats.error);
  if (prods.error) falha('os produtos', prods.error);
  if (kits.error) falha('os kits', kits.error);

  const variantIds = prods.data.flatMap((p) => p.product_variants.map((v) => v.id));
  const disp = await db.rpc('disponibilidade', { p_variant_ids: variantIds });
  if (disp.error) falha('a disponibilidade', disp.error);
  const disponivel = new Map(disp.data.map((d) => [d.variant_id, d.disponivel]));

  // Variação → produto, para montar as peças dos kits compostos.
  const produtoDaVariacao = new Map<string, (typeof prods.data)[number]>();
  for (const p of prods.data) for (const v of p.product_variants) produtoDaVariacao.set(v.id, p);

  const agora = Date.now();
  const products: Product[] = [];
  prods.data.forEach((p, i) => {
    const variantes = p.product_variants.filter((v) => v.active).sort((a, b) => a.position - b.position);
    if (variantes.length === 0) return; // produto sem variação ativa não aparece na vitrine

    const attrsDe = (v: (typeof variantes)[number]) => (v.attributes ?? {}) as Record<string, string>;
    const groups: VariantGroup[] = ATRIBUTOS.flatMap(([chave, rotulo]) => {
      const values = [...new Set(variantes.map((v) => attrsDe(v)[chave]).filter(Boolean))];
      return values.length ? [{ name: rotulo, values }] : [];
    });
    const chaves = ATRIBUTOS.filter(([, rotulo]) => groups.some((g) => g.name === rotulo)).map(([chave]) => chave);

    const variants: Variant[] = variantes.map((v) => {
      const vals = chaves.map((c) => attrsDe(v)[c] ?? '');
      return { id: v.id, key: vals.join('|'), vals, label: vals.join(' · ') || 'Único', sku: v.sku, ...precoAgora(v, agora), avail: disponivel.get(v.id) ?? false };
    });

    const kind = KIND[p.kind];
    let comps: KitComponent[] | null = null;
    if (kind === 'kit_composed') {
      const kitIds = new Set(variantes.map((v) => v.id));
      comps = kits.data
        .filter((k) => kitIds.has(k.kit_variant_id))
        .flatMap((k) => {
          const peca = produtoDaVariacao.get(k.component_variant_id);
          return peca ? [{ ref: peca.id, name: peca.name, unit: peca.sale_unit, qty: k.quantity, avail: disponivel.get(k.component_variant_id) ?? false }] : [];
        });
    }

    const categorias = p.product_categories
      .flatMap((pc) => (pc.categories ? [pc.categories] : []))
      .sort((a, b) => a.position - b.position);

    products.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      catIds: categorias.map((c) => c.slug),
      catNames: categorias.map((c) => c.name),
      // Ilustração provisória: brilho na peça quando o material cita pedra ou pérola.
      gem: /zirc|pérola|perola|cristal|pedra/i.test(`${p.material} ${p.description}`),
      isNew: p.is_new,
      best: p.is_featured,
      unit: p.sale_unit,
      groups,
      base: Math.min(...variants.map((v) => v.price)),
      desc: p.description,
      short: p.short_description || undefined,
      material: p.material,
      kind,
      isKit: kind !== 'simple',
      variants,
      tone: toneOf(variants[0].vals),
      bg: i % 4,
      comps,
    });
  });

  return { categories: cats.data.map((c) => ({ id: c.slug, name: c.name })), products };
});
