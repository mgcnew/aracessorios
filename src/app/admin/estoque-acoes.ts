'use server';

import { supabaseServidor } from '../../lib/supabase/server';
import { validarValor, type LinhaEstoque, type Movimento, type Operacao } from '../../admin/estoque';

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

/** Mensagem do banco quando ele recusa; trocamos só os casos sem texto útil. */
function mensagem(erro: { code?: string; message: string }): string {
  if (erro.code === '42501') return 'Acesso restrito ao painel. Entre de novo com a conta da loja.';
  if (erro.code === 'PGRST301' || /JWT/i.test(erro.message)) return 'Sua sessão expirou. Entre de novo.';
  return erro.message;
}

export async function carregarEstoque(): Promise<Resultado<LinhaEstoque[]>> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc('painel_estoque');
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
): Promise<Resultado<LinhaEstoque[]>> {
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

  return carregarEstoque();
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
