'use server';

import {
  SLUG_OK,
  limparAtributos,
  mensagemDoBanco,
  pendenciasParaAtivar,
  validarVariacao,
  type CatalogoPainel,
  type FormVariacao,
  type PecaKit,
  type ProdutoPainel,
  type StatusProduto,
  type TipoProduto,
  type UnidadeVenda,
} from '../../admin/produtos';
import { supabaseServidor } from '../../lib/supabase/server';

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };
const falha = (erro: string) => ({ ok: false as const, erro });

/** Catálogo inteiro do painel, inclusive rascunhos e arquivados. */
export async function carregarCatalogoPainel(): Promise<Resultado<CatalogoPainel>> {
  const db = await supabaseServidor();
  const [cats, prods, pecas, estoque] = await Promise.all([
    db.from('categories').select('id, name').order('position'),
    db
      .from('products')
      .select(
        `id, slug, name, short_description, description, material, care_info, status, kind, sale_unit, is_new, is_featured,
         product_categories ( category_id ),
         product_variants ( id, sku, attributes, price_cents, promo_price_cents, promo_starts_at, promo_ends_at, position, active )`,
      )
      .order('name'),
    db.from('kit_components').select('kit_variant_id, component_variant_id, quantity'),
    // Estoque mínimo não é lido direto da tabela; vem pela função do painel.
    db.rpc('painel_estoque'),
  ]);
  for (const r of [cats, prods, pecas, estoque]) if (r.error) return falha(mensagemDoBanco(r.error));

  const minimo = new Map((estoque.data ?? []).map((l) => [l.variant_id, l.min_stock]));
  const pecasDe = new Map<string, PecaKit[]>();
  for (const k of pecas.data ?? []) {
    const lista = pecasDe.get(k.kit_variant_id) ?? [];
    lista.push({ component_variant_id: k.component_variant_id, quantity: k.quantity });
    pecasDe.set(k.kit_variant_id, lista);
  }

  const produtos: ProdutoPainel[] = (prods.data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    short_description: p.short_description,
    description: p.description,
    material: p.material,
    care_info: p.care_info,
    status: p.status,
    kind: p.kind,
    sale_unit: p.sale_unit,
    is_new: p.is_new,
    is_featured: p.is_featured,
    categorias: p.product_categories.map((c) => c.category_id),
    variacoes: p.product_variants
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        attributes: limparAtributos(v.attributes as Record<string, unknown>),
        price_cents: v.price_cents,
        promo_price_cents: v.promo_price_cents,
        promo_starts_at: v.promo_starts_at,
        promo_ends_at: v.promo_ends_at,
        min_stock: minimo.get(v.id) ?? 0,
        position: v.position,
        active: v.active,
        pecas: pecasDe.get(v.id) ?? [],
      }))
      .sort((a, b) => a.position - b.position || a.sku.localeCompare(b.sku)),
  }));

  return { ok: true, dados: { categorias: cats.data ?? [], produtos } };
}

async function depois<T>(extra: T): Promise<Resultado<CatalogoPainel & { extra: T }>> {
  const r = await carregarCatalogoPainel();
  return r.ok ? { ok: true, dados: { ...r.dados, extra } } : r;
}

// Produto ------------------------------------------------------------------------

export interface NovoProduto {
  name: string;
  slug: string;
  kind: TipoProduto;
  sale_unit: UnidadeVenda;
}

/** Cria o produto como rascunho (fora da vitrine). */
export async function criarProduto(n: NovoProduto) {
  const name = n.name.trim();
  const slug = n.slug.trim();
  if (!name) return falha('Informe o nome.');
  if (!SLUG_OK.test(slug)) return falha('Endereço (slug) inválido: só letras minúsculas, números e hífen.');
  const db = await supabaseServidor();
  const { data, error } = await db
    .from('products')
    .insert({ name, slug, kind: n.kind, sale_unit: n.sale_unit, status: 'rascunho' })
    .select('id')
    .single();
  if (error) return falha(mensagemDoBanco(error));
  return depois(data.id);
}

export interface DadosProduto {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  material: string;
  care_info: string;
  sale_unit: UnidadeVenda;
  is_new: boolean;
  is_featured: boolean;
}

export async function salvarDadosProduto(id: string, d: DadosProduto) {
  const name = d.name.trim();
  const slug = d.slug.trim();
  if (!name) return falha('Informe o nome.');
  if (!SLUG_OK.test(slug)) return falha('Endereço (slug) inválido: só letras minúsculas, números e hífen.');
  const db = await supabaseServidor();
  const { error } = await db
    .from('products')
    .update({
      name,
      slug,
      short_description: d.short_description.trim(),
      description: d.description.trim(),
      material: d.material.trim(),
      care_info: d.care_info.trim(),
      sale_unit: d.sale_unit,
      is_new: d.is_new,
      is_featured: d.is_featured,
    })
    .eq('id', id);
  if (error) return falha(mensagemDoBanco(error));
  return depois(null);
}

/** Troca as categorias do produto pelas marcadas (CAT-DEC-016). */
export async function salvarCategorias(id: string, categoriaIds: string[]) {
  const db = await supabaseServidor();
  const atual = await db.from('product_categories').select('category_id').eq('product_id', id);
  if (atual.error) return falha(mensagemDoBanco(atual.error));
  const antes = new Set(atual.data.map((c) => c.category_id));
  const agora = new Set(categoriaIds);
  const tirar = [...antes].filter((c) => !agora.has(c));
  const por = [...agora].filter((c) => !antes.has(c));
  if (por.length) {
    const { error } = await db.from('product_categories').insert(por.map((category_id) => ({ product_id: id, category_id })));
    if (error) return falha(mensagemDoBanco(error));
  }
  if (tirar.length) {
    const { error } = await db.from('product_categories').delete().eq('product_id', id).in('category_id', tirar);
    if (error) return falha(mensagemDoBanco(error));
  }
  return depois(null);
}

export async function mudarStatus(id: string, status: StatusProduto) {
  if (status === 'ativo') {
    const cat = await carregarCatalogoPainel();
    if (!cat.ok) return cat;
    const p = cat.dados.produtos.find((x) => x.id === id);
    if (!p) return falha('Produto não encontrado.');
    const falta = pendenciasParaAtivar(p);
    if (falta.length) return falha(`Ainda não dá para ativar: ${falta.join(' ')}`);
  }
  const db = await supabaseServidor();
  const { error } = await db.from('products').update({ status }).eq('id', id);
  if (error) return falha(mensagemDoBanco(error));
  return depois(null);
}

/** Só rascunho pode ser apagado (regra do banco); o resto é arquivado. */
export async function apagarProduto(id: string) {
  const db = await supabaseServidor();
  const { data, error } = await db.from('products').delete().eq('id', id).eq('status', 'rascunho').select('id');
  if (error) {
    if (error.code === '23503')
      return falha('Não dá para apagar: o produto já tem histórico de estoque ou é peça de um kit. Arquive em vez de apagar.');
    return falha(mensagemDoBanco(error));
  }
  if (!data || data.length === 0) return falha('Só produtos em rascunho podem ser apagados. Arquive o produto.');
  return depois(null);
}

// Variações ----------------------------------------------------------------------

/** Cria ou altera uma variação. Variação nova começa com saldo 0 (o banco cria a linha de saldo). */
export async function salvarVariacao(productId: string, form: FormVariacao) {
  const v = validarVariacao(form);
  if ('erro' in v) return falha(v.erro);
  const { id, ...campos } = v.dados;
  const db = await supabaseServidor();
  if (id) {
    const { error } = await db.from('product_variants').update(campos).eq('id', id).eq('product_id', productId);
    if (error) return falha(mensagemDoBanco(error));
    return depois(id);
  }
  const ultima = await db
    .from('product_variants')
    .select('position')
    .eq('product_id', productId)
    .order('position', { ascending: false })
    .limit(1);
  const position = (ultima.data?.[0]?.position ?? -1) + 1;
  const { data, error } = await db
    .from('product_variants')
    .insert({ ...campos, product_id: productId, position })
    .select('id')
    .single();
  if (error) return falha(mensagemDoBanco(error));
  return depois(data.id);
}

export async function apagarVariacao(variantId: string) {
  const db = await supabaseServidor();
  const { data, error } = await db.from('product_variants').delete().eq('id', variantId).select('id');
  if (error) return falha(mensagemDoBanco(error));
  if (!data || data.length === 0) return falha('Variação não encontrada.');
  return depois(null);
}

// Peças do kit composto ---------------------------------------------------------

/**
 * Troca a composição de uma variação de kit composto (CAT-DEC-019).
 * Enquanto Q-CAT-03 estiver em aberto, só vale para kit em rascunho.
 */
export async function salvarPecas(kitVariantId: string, pecas: PecaKit[]) {
  const limpas = pecas.filter((p) => p.component_variant_id);
  if (limpas.some((p) => !Number.isInteger(p.quantity) || p.quantity < 1 || p.quantity > 99))
    return falha('Quantidade de cada peça: número inteiro de 1 a 99.');
  if (new Set(limpas.map((p) => p.component_variant_id)).size !== limpas.length)
    return falha('A mesma peça aparece duas vezes. Junte as quantidades numa linha só.');

  const db = await supabaseServidor();
  const kit = await db.from('product_variants').select('id, products ( status, kind )').eq('id', kitVariantId).single();
  if (kit.error) return falha(mensagemDoBanco(kit.error));
  if (kit.data.products?.kind !== 'kit_composto') return falha('Só variações de kit composto têm peças.');
  if (kit.data.products?.status !== 'rascunho')
    return falha('A composição só pode mudar enquanto o kit está em rascunho (Q-CAT-03 em aberto). Para mudar, arquive e crie outro kit.');

  const atual = await db.from('kit_components').select('component_variant_id').eq('kit_variant_id', kitVariantId);
  if (atual.error) return falha(mensagemDoBanco(atual.error));
  const novas = new Set(limpas.map((p) => p.component_variant_id));
  const tirar = atual.data.map((p) => p.component_variant_id).filter((c) => !novas.has(c));

  if (limpas.length) {
    const { error } = await db
      .from('kit_components')
      .upsert(limpas.map((p) => ({ kit_variant_id: kitVariantId, component_variant_id: p.component_variant_id, quantity: p.quantity })));
    if (error) return falha(mensagemDoBanco(error));
  }
  if (tirar.length) {
    const { error } = await db.from('kit_components').delete().eq('kit_variant_id', kitVariantId).in('component_variant_id', tirar);
    if (error) return falha(mensagemDoBanco(error));
  }
  return depois(null);
}
