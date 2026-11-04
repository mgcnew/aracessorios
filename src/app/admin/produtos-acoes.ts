'use server';

import {
  SLUG_OK,
  limparAtributos,
  mensagemDoBanco,
  pendenciasParaAtivar,
  validarVariacao,
  POR_PAGINA,
  termoBusca,
  textoAtributos,
  type CatalogoPainel,
  type FiltroStatus,
  type FormVariacao,
  type OpcaoPeca,
  type PaginaProdutos,
  type PecaKit,
  type ProdutoPainel,
  type StatusProduto,
  type TipoProduto,
  type UnidadeVenda,
} from '../../admin/produtos';
import { updateTag } from 'next/cache';
import { TAG_CATALOGO } from '../../lib/cache';
import { supabaseServidor } from '../../lib/supabase/server';

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };
const falha = (erro: string) => ({ ok: false as const, erro });

type Db = Awaited<ReturnType<typeof supabaseServidor>>;

const CAMPOS_PRODUTO = `id, slug, name, short_description, description, material, care_info, status, kind, sale_unit, is_new, is_featured,
   product_categories ( category_id ),
   product_variants ( id, sku, attributes, price_cents, promo_price_cents, promo_starts_at, promo_ends_at, position, active ),
   product_images ( id, storage_path, alt, position, is_cover )`;

/** Completa as linhas de produto com estoque mínimo e peças de kit, só das variações pedidas. */
async function montarProdutos(db: Db, linhas: unknown[]): Promise<Resultado<ProdutoPainel[]>> {
  type Linha = {
    id: string; slug: string; name: string; short_description: string; description: string; material: string; care_info: string;
    status: StatusProduto; kind: TipoProduto; sale_unit: UnidadeVenda; is_new: boolean; is_featured: boolean;
    product_categories: { category_id: string }[];
    product_variants: { id: string; sku: string; attributes: unknown; price_cents: number; promo_price_cents: number | null; promo_starts_at: string | null; promo_ends_at: string | null; position: number; active: boolean }[];
    product_images: ProdutoPainel['fotos'];
  };
  const prods = linhas as Linha[];
  const ids = prods.map((p) => p.id);
  const variantes = prods.flatMap((p) => p.product_variants.map((v) => v.id));
  if (!ids.length) return { ok: true, dados: [] };
  // Estoque mínimo não é lido direto da tabela; vem pela função do painel, filtrada.
  const [pecas, estoque] = await Promise.all([
    variantes.length ? db.from('kit_components').select('kit_variant_id, component_variant_id, quantity').in('kit_variant_id', variantes) : null,
    db.rpc('painel_estoque').in('product_id', ids).select('variant_id, min_stock'),
  ]);
  if (pecas?.error) return falha(mensagemDoBanco(pecas.error));
  if (estoque.error) return falha(mensagemDoBanco(estoque.error));

  const minimo = new Map((estoque.data ?? []).map((l) => [l.variant_id, l.min_stock]));
  const pecasDe = new Map<string, PecaKit[]>();
  for (const k of pecas?.data ?? []) {
    const lista = pecasDe.get(k.kit_variant_id) ?? [];
    lista.push({ component_variant_id: k.component_variant_id, quantity: k.quantity });
    pecasDe.set(k.kit_variant_id, lista);
  }

  const dados: ProdutoPainel[] = prods.map((p) => ({
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
    fotos: [...p.product_images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position),
  }));
  return { ok: true, dados };
}

/** Categorias (poucas): vão junto da listagem e das respostas. */
async function categorias(db: Db) {
  return db.from('categories').select('id, name').order('position');
}

/**
 * Uma página da lista de produtos (POR_PAGINA por vez), com busca por nome, endereço
 * ou SKU e filtro por status, tudo no banco. Em vez do catálogo inteiro de uma vez.
 */
export async function carregarProdutosPagina(f: { pagina: number; busca: string; status: FiltroStatus }): Promise<Resultado<PaginaProdutos>> {
  const db = await supabaseServidor();
  const termo = termoBusca(f.busca);
  const pagina = Math.max(1, Math.floor(f.pagina) || 1);

  let porSku: string[] = [];
  if (termo) {
    const v = await db.from('product_variants').select('product_id').ilike('sku', `%${termo}%`).limit(200);
    if (v.error) return falha(mensagemDoBanco(v.error));
    porSku = [...new Set(v.data.map((x) => x.product_id))];
  }

  let q = db.from('products').select(CAMPOS_PRODUTO, { count: 'exact' });
  if (f.status !== 'todos') q = q.eq('status', f.status);
  if (termo) q = q.or([`name.ilike.*${termo}*`, `slug.ilike.*${termo}*`, porSku.length ? `id.in.(${porSku.join(',')})` : ''].filter(Boolean).join(','));
  const de = (pagina - 1) * POR_PAGINA;

  const contar = (status?: StatusProduto) => {
    const c = db.from('products').select('id', { count: 'exact', head: true });
    return status ? c.eq('status', status) : c;
  };
  const [lista, cats, todos, ativo, rascunho, arquivado] = await Promise.all([
    q.order('name').order('id').range(de, de + POR_PAGINA - 1),
    categorias(db),
    contar(),
    contar('ativo'),
    contar('rascunho'),
    contar('arquivado'),
  ]);
  for (const r of [lista, cats, todos, ativo, rascunho, arquivado]) if (r.error) return falha(mensagemDoBanco(r.error));

  const prods = await montarProdutos(db, lista.data ?? []);
  if (!prods.ok) return prods;
  return {
    ok: true,
    dados: {
      produtos: prods.dados,
      total: lista.count ?? 0,
      contagem: { todos: todos.count ?? 0, ativo: ativo.count ?? 0, rascunho: rascunho.count ?? 0, arquivado: arquivado.count ?? 0 },
      categorias: cats.data ?? [],
    },
  };
}

/** Um produto só, completo (abrir o editor direto pelo endereço). */
export async function carregarProduto(id: string): Promise<Resultado<ProdutoPainel | null>> {
  const db = await supabaseServidor();
  const { data, error } = await db.from('products').select(CAMPOS_PRODUTO).eq('id', id).maybeSingle();
  if (error) return falha(mensagemDoBanco(error));
  if (!data) return { ok: true, dados: null };
  const r = await montarProdutos(db, [data]);
  return r.ok ? { ok: true, dados: r.dados[0] } : r;
}

/** Peças possíveis para kit composto; só carrega quando alguém edita as peças. */
export async function carregarOpcoesPecas(): Promise<Resultado<OpcaoPeca[]>> {
  const db = await supabaseServidor();
  const { data, error } = await db
    .from('products')
    .select('name, kind, product_variants ( id, sku, attributes, active )')
    .neq('kind', 'kit_composto')
    .order('name');
  if (error) return falha(mensagemDoBanco(error));
  return {
    ok: true,
    dados: data.flatMap((x) =>
      x.product_variants.map((vv) => ({
        id: vv.id,
        nome: `${x.name} — ${textoAtributos(limparAtributos(vv.attributes as Record<string, unknown>))} (${vv.sku})${vv.active ? '' : ' · inativa'}`,
      })),
    ),
  };
}

/**
 * Depois de uma mudança: devolve só o produto alterado (ou o id do apagado) e expira
 * o cache da vitrine, para a cliente ver a mudança no clique seguinte.
 */
async function depois<T>(produtoId: string | null, extra: T, removido?: string): Promise<Resultado<CatalogoPainel & { extra: T }>> {
  updateTag(TAG_CATALOGO);
  const db = await supabaseServidor();
  const cats = await categorias(db);
  if (cats.error) return falha(mensagemDoBanco(cats.error));
  if (!produtoId) return { ok: true, dados: { categorias: cats.data, produtos: [], removido, extra } };
  const p = await carregarProduto(produtoId);
  if (!p.ok) return p;
  return { ok: true, dados: { categorias: cats.data, produtos: p.dados ? [p.dados] : [], removido, extra } };
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
  return depois(data.id, data.id);
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
  return depois(id, null);
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
  return depois(id, null);
}

export async function mudarStatus(id: string, status: StatusProduto) {
  if (status === 'ativo') {
    const cat = await carregarProduto(id);
    if (!cat.ok) return cat;
    const p = cat.dados;
    if (!p) return falha('Produto não encontrado.');
    const falta = pendenciasParaAtivar(p);
    if (falta.length) return falha(`Ainda não dá para ativar: ${falta.join(' ')}`);
  }
  const db = await supabaseServidor();
  const { error } = await db.from('products').update({ status }).eq('id', id);
  if (error) return falha(mensagemDoBanco(error));
  return depois(id, null);
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
  // Só os vínculos saem com o rascunho; a biblioteca preserva os arquivos.
  return depois(null, null, id);
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
    return depois(productId, id);
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
  return depois(productId, data.id);
}

export async function apagarVariacao(variantId: string) {
  const db = await supabaseServidor();
  const { data, error } = await db.from('product_variants').delete().eq('id', variantId).select('id, product_id');
  if (error) return falha(mensagemDoBanco(error));
  if (!data || data.length === 0) return falha('Variação não encontrada.');
  return depois(data[0].product_id, null);
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
  const kit = await db.from('product_variants').select('id, product_id, products ( status, kind )').eq('id', kitVariantId).single();
  if (kit.error) return falha(mensagemDoBanco(kit.error));
  if (kit.data.products?.kind !== 'kit_composto') return falha('Só variações de kit composto têm peças.');
  if (kit.data.products?.status !== 'rascunho')
    return falha('A composição só pode mudar enquanto o kit está em rascunho (Q-CAT-03 em aberto). Para mudar, tire o kit da loja (volta para rascunho).');

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
  return depois(kit.data.product_id, null);
}
