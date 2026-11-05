'use server';

import type { DespesaFixaRow, LancamentoRow } from '../../lib/database-biblioteca.types';
import { supabaseServidor } from '../../lib/supabase/server';
import { POR_PAGINA } from '../../admin/produtos';
import { hoje, mesValido, ultimoDia, type DespesaPendente, type FiltroFinanceiro, type PaginaFinanceiro } from '../../admin/financeiro';

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };
const falha = (erro: string) => ({ ok: false as const, erro });

/** Mensagem do banco; a tabela ausente (migração ainda não aplicada) ganha um texto que diz o que fazer. */
function mensagem(erro: { code?: string; message: string }): string {
  if (erro.code === '42P01' || erro.code === '42883' || erro.code === 'PGRST205' || erro.code === 'PGRST202' || /schema cache|does not exist/i.test(erro.message))
    return 'As tabelas do financeiro ainda não existem no banco. Aplique supabase/migrations/20261105090000_financeiro_painel.sql no SQL Editor.';
  if (erro.code === '42501') return 'Acesso restrito ao painel. Entre de novo com a conta da loja.';
  if (erro.code === 'PGRST301' || /JWT/i.test(erro.message)) return 'Sua sessão expirou. Entre de novo.';
  if (erro.code === '23505') return 'Esta despesa já foi paga neste mês.';
  return erro.message;
}

async function cliente() {
  const db = await supabaseServidor();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { ok: false as const, erro: 'Sua sessão expirou. Entre de novo.' };
  const { data: admin } = await db.rpc('is_admin');
  if (admin !== true) return { ok: false as const, erro: 'Acesso restrito ao painel.' };
  return { ok: true as const, db };
}

const CAT = /^[a-z0-9áéíóúâêôãõç _-]{1,40}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const centavosOk = (c: number) => Number.isInteger(c) && c > 0 && c <= 100_000_000;
const dataOk = (d: string) => DATA.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d;

/** Um mês do financeiro: totais, despesas fixas a pagar e uma página de lançamentos. */
export async function carregarFinanceiro(f: FiltroFinanceiro): Promise<Resultado<PaginaFinanceiro>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (!mesValido(f.mes)) return falha('Mês inválido.');
  const pagina = Math.max(1, Math.floor(f.pagina) || 1);
  const inicio = `${f.mes}-01`;
  const fim = `${f.mes}-${String(ultimoDia(f.mes)).padStart(2, '0')}`;
  const de = (pagina - 1) * POR_PAGINA;

  let lista = c.db.from('finance_entries').select('*', { count: 'exact' }).gte('occurred_on', inicio).lte('occurred_on', fim);
  if (f.tipo !== 'todos') lista = lista.eq('kind', f.tipo);

  const [resumo, fixas, pagas, linhas] = await Promise.all([
    c.db.rpc('financeiro_resumo', { p_inicio: inicio, p_fim: fim }).single(),
    c.db.from('finance_fixed_expenses').select('*').order('due_day').order('name'),
    c.db.from('finance_entries').select('fixed_expense_id').eq('competence', inicio).not('fixed_expense_id', 'is', null),
    lista.order('occurred_on', { ascending: false }).order('created_at', { ascending: false }).range(de, de + POR_PAGINA - 1),
  ]);
  for (const r of [resumo, fixas, pagas, linhas]) if (r.error) return falha(mensagem(r.error));

  const pagasIds = new Set((pagas.data ?? []).map((p) => p.fixed_expense_id));
  const h = hoje();
  const pendentes: DespesaPendente[] = (fixas.data ?? [])
    // Só entra no mês quem já existia nele (cadastrar hoje não cria dívida em meses passados).
    .filter((x) => x.active && !pagasIds.has(x.id) && x.created_at.slice(0, 7) <= f.mes)
    .map((x) => {
      const vence = `${f.mes}-${String(Math.min(x.due_day, ultimoDia(f.mes))).padStart(2, '0')}`;
      return { fixa: x, vence, atrasada: vence < h };
    });

  return {
    ok: true,
    dados: {
      mes: f.mes,
      entradas: Number(resumo.data?.entradas ?? 0),
      saidas: Number(resumo.data?.saidas ?? 0),
      aPagar: pendentes.reduce((s, p) => s + p.fixa.amount_cents, 0),
      pendentes,
      lancamentos: linhas.data ?? [],
      total: linhas.count ?? 0,
      fixas: fixas.data ?? [],
    },
  };
}

export async function criarLancamento(d: {
  kind: 'entrada' | 'saida';
  amount_cents: number;
  occurred_on: string;
  category: string;
  description: string;
}): Promise<Resultado<LancamentoRow>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (d.kind !== 'entrada' && d.kind !== 'saida') return falha('Escolha entrada ou saída.');
  if (!centavosOk(d.amount_cents)) return falha('Informe um valor maior que zero.');
  if (!dataOk(d.occurred_on)) return falha('Informe a data.');
  if (!CAT.test(d.category)) return falha('Escolha a categoria.');
  const descricao = d.description.trim();
  if (descricao.length > 160) return falha('A descrição passa de 160 letras.');
  const { data, error } = await c.db
    .from('finance_entries')
    .insert({ kind: d.kind, amount_cents: d.amount_cents, occurred_on: d.occurred_on, category: d.category, description: descricao })
    .select('*')
    .single();
  if (error) return falha(mensagem(error));
  return { ok: true, dados: data };
}

/** Apagar um pagamento de despesa fixa devolve a despesa para "a pagar" daquele mês. */
export async function apagarLancamento(id: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const { data, error } = await c.db.from('finance_entries').delete().eq('id', id).select('id');
  if (error) return falha(mensagem(error));
  if (!data || data.length === 0) return falha('Lançamento não encontrado.');
  return { ok: true, dados: null };
}

export async function salvarDespesaFixa(d: {
  id?: string;
  name: string;
  amount_cents: number;
  due_day: number;
  category: string;
  active: boolean;
}): Promise<Resultado<DespesaFixaRow>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const nome = d.name.trim();
  if (!nome || nome.length > 80) return falha('Informe o nome (até 80 letras).');
  if (!centavosOk(d.amount_cents)) return falha('Informe um valor maior que zero.');
  if (!Number.isInteger(d.due_day) || d.due_day < 1 || d.due_day > 31) return falha('O dia do vencimento vai de 1 a 31.');
  if (!CAT.test(d.category)) return falha('Escolha a categoria.');
  const campos = { name: nome, amount_cents: d.amount_cents, due_day: d.due_day, category: d.category, active: d.active };
  const q = d.id ? c.db.from('finance_fixed_expenses').update(campos).eq('id', d.id) : c.db.from('finance_fixed_expenses').insert(campos);
  const { data, error } = await q.select('*').single();
  if (error) return falha(mensagem(error));
  return { ok: true, dados: data };
}

/** Os pagamentos já lançados ficam (o dinheiro saiu); só a despesa deixa de se repetir. */
export async function apagarDespesaFixa(id: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const { data, error } = await c.db.from('finance_fixed_expenses').delete().eq('id', id).select('id');
  if (error) return falha(mensagem(error));
  if (!data || data.length === 0) return falha('Despesa não encontrada.');
  return { ok: true, dados: null };
}

/** Marca a despesa fixa de um mês como paga: vira uma saída (valor pode diferir do cadastrado, ex.: conta de luz). */
export async function pagarDespesaFixa(d: { fixaId: string; mes: string; amount_cents: number; occurred_on: string }): Promise<Resultado<LancamentoRow>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (!mesValido(d.mes)) return falha('Mês inválido.');
  if (!centavosOk(d.amount_cents)) return falha('Informe um valor maior que zero.');
  if (!dataOk(d.occurred_on)) return falha('Informe a data do pagamento.');
  const fixa = await c.db.from('finance_fixed_expenses').select('name, category').eq('id', d.fixaId).maybeSingle();
  if (fixa.error) return falha(mensagem(fixa.error));
  if (!fixa.data) return falha('Despesa não encontrada.');
  const { data, error } = await c.db
    .from('finance_entries')
    .insert({
      kind: 'saida',
      amount_cents: d.amount_cents,
      occurred_on: d.occurred_on,
      category: fixa.data.category,
      description: fixa.data.name,
      fixed_expense_id: d.fixaId,
      competence: `${d.mes}-01`,
    })
    .select('*')
    .single();
  if (error) return falha(mensagem(error));
  return { ok: true, dados: data };
}
