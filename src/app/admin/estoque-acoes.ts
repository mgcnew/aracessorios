'use server';

import { updateTag } from 'next/cache';
import { TAG_CATALOGO } from '../../lib/cache';
import { supabaseServidor } from '../../lib/supabase/server';
import { validarValor, type FiltroEstoque, type LinhaEstoque, type Movimento, type Operacao, type PaginaEstoque } from '../../admin/estoque';
import { POR_PAGINA, termoBusca } from '../../admin/produtos';

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

/** Mensagem do banco quando ele recusa; trocamos só os casos sem texto útil. */
function mensagem(erro: { code?: string; message: string }): string {
  if (erro.code === '42501') return 'Acesso restrito ao painel. Entre de novo com a conta da loja.';
  if (erro.code === 'PGRST301' || /JWT/i.test(erro.message)) return 'Sua sessão expirou. Entre de novo.';
  return erro.message;
}

/**
 * Uma página do estoque (POR_PAGINA linhas), com busca por produto ou SKU e filtros no
 * banco. Produtos arquivados ficam de fora, a não ser que se peça para vê-los.
 */
export async function carregarEstoquePagina(f: FiltroEstoque): Promise<Resultado<PaginaEstoque>> {
  const db = await supabaseServidor();
  const termo = termoBusca(f.busca);
  const pagina = Math.max(1, Math.floor(f.pagina) || 1);

  const arq = await db.from('products').select('id').eq('status', 'arquivado');
  if (arq.error) return { ok: false, erro: mensagem(arq.error) };
  const arquivados = arq.data.map((p) => p.id);

  // Mesmo filtro para a lista e para as contagens (variant/product ids são uuids: seguros na lista).
  const base = (opcoes?: { count: 'exact'; head?: boolean }) => {
    let q = db.rpc('painel_estoque', undefined, opcoes);
    if (!f.verArquivados && arquivados.length) q = q.not('product_id', 'in', `(${arquivados.join(',')})`);
    if (termo) q = q.or(`product_name.ilike.*${termo}*,sku.ilike.*${termo}*`);
    return q;
  };
  const de = (pagina - 1) * POR_PAGINA;
  let lista = base({ count: 'exact' });
  if (f.soBaixo) lista = lista.eq('abaixo_do_minimo', true);
  const qArq = arquivados.length
    ? db.rpc('painel_estoque', undefined, { count: 'exact', head: true }).in('product_id', arquivados)
    : null;

  const [linhas, baixo, emArquivados] = await Promise.all([
    lista.order('product_name').order('sku').range(de, de + POR_PAGINA - 1),
    base({ count: 'exact', head: true }).eq('abaixo_do_minimo', true),
    qArq,
  ]);
  for (const r of [linhas, baixo, emArquivados]) if (r?.error) return { ok: false, erro: mensagem(r.error) };
  return {
    ok: true,
    dados: { linhas: linhas.data ?? [], total: linhas.count ?? 0, baixo: baixo.count ?? 0, arquivadas: emArquivados?.count ?? 0, arquivados },
  };
}

/** Uma linha só (depois de movimentar). */
async function linhaEstoque(variantId: string): Promise<Resultado<LinhaEstoque>> {
  const db = await supabaseServidor();
  const { data, error } = await db.rpc('painel_estoque').eq('variant_id', variantId).single();
  if (error) return { ok: false, erro: mensagem(error) };
  return { ok: true, dados: data };
}

/**
 * Registra entrada, ajuste ou contagem. As regras (motivo obrigatório, saldo
 * nunca negativo, kit composto sem estoque próprio, só admin) ficam no banco.
 */
export async function movimentarEstoque(
  op: Operacao,
  variantId: string,
  valorTexto: string,
  motivo: string,
): Promise<Resultado<LinhaEstoque>> {
  const v = validarValor(op, valorTexto);
  if ('erro' in v) return { ok: false, erro: v.erro };
  if (!motivo.trim()) return { ok: false, erro: 'Informe o motivo.' };

  const supabase = await supabaseServidor();
  const chamada =
    op === 'entrada'
      ? supabase.rpc('registrar_entrada', { p_variant_id: variantId, p_quantidade: v.valor, p_motivo: motivo })
      : op === 'ajuste'
        ? supabase.rpc('registrar_ajuste', { p_variant_id: variantId, p_diferenca: v.valor, p_motivo: motivo })
        : supabase.rpc('registrar_contagem', { p_variant_id: variantId, p_contado: v.valor, p_motivo: motivo });
  const { error } = await chamada;
  if (error) return { ok: false, erro: mensagem(error) };

  // A vitrine mostra disponível/esgotado: expira o cache para refletir no clique seguinte.
  updateTag(TAG_CATALOGO);
  return linhaEstoque(variantId);
}

export async function historicoVariacao(variantId: string): Promise<Resultado<Movimento[]>> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('id, created_at, type, on_hand_delta, reserved_delta, on_hand_after, reason')
    .eq('variant_id', variantId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(30);
  if (error) return { ok: false, erro: mensagem(error) };
  return { ok: true, dados: data };
}
