'use server';

import type { AvisoRow } from '../../lib/database-biblioteca.types';
import { chavePublica, enviarPushAvisos, pushConfigurado, type ResumoEnvio } from '../../lib/push';
import { supabaseServidor } from '../../lib/supabase/server';

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };
const falha = (erro: string) => ({ ok: false as const, erro });

/** Mensagem do banco; a tabela ausente (migração ainda não aplicada) ganha um texto que diz o que fazer. */
function mensagem(erro: { code?: string; message: string }): string {
  if (erro.code === '42P01' || erro.code === 'PGRST205' || /schema cache|does not exist/i.test(erro.message))
    return 'As tabelas dos avisos ainda não existem no banco. Aplique supabase/migrations/20261104100000_avisos_painel.sql no SQL Editor.';
  if (erro.code === '42501') return 'Acesso restrito ao painel. Entre de novo com a conta da loja.';
  if (erro.code === 'PGRST301' || /JWT/i.test(erro.message)) return 'Sua sessão expirou. Entre de novo.';
  return erro.message;
}

async function cliente() {
  const db = await supabaseServidor();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { ok: false as const, erro: 'Sua sessão expirou. Entre de novo.' };
  const { data: admin } = await db.rpc('is_admin');
  if (admin !== true) return { ok: false as const, erro: 'Acesso restrito ao painel.' };
  return { ok: true as const, db, userId: auth.user.id };
}

export interface EstadoAvisos {
  /** Chaves de envio configuradas neste ambiente (VAPID). Sem elas o aparelho não consegue se cadastrar. */
  configurado: boolean;
  chavePublica: string;
  avisos: AvisoRow[];
  naoLidos: number;
  aparelhos: number;
}

export async function carregarAvisos(): Promise<Resultado<EstadoAvisos>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const [lista, naoLidos, aparelhos] = await Promise.all([
    c.db.from('admin_notifications').select('id, kind, title, body, url, created_at, read_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(30),
    c.db.from('admin_notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
    c.db.from('push_subscriptions').select('id', { count: 'exact', head: true }),
  ]);
  for (const r of [lista, naoLidos, aparelhos]) if (r.error) return falha(mensagem(r.error));
  return {
    ok: true,
    dados: { configurado: pushConfigurado(), chavePublica: chavePublica(), avisos: lista.data ?? [], naoLidos: naoLidos.count ?? 0, aparelhos: aparelhos.count ?? 0 },
  };
}

/** Só o contador do sino; barato, chamado de tempos em tempos. Falha em silêncio (devolve null). */
export async function contarNaoLidos(): Promise<number | null> {
  const c = await cliente();
  if (!c.ok) return null;
  const { count, error } = await c.db.from('admin_notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  return error ? null : (count ?? 0);
}

export interface AssinaturaPush {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Cadastra este aparelho para receber avisos. Se o endereço já existe (reinstalou), troca o registro. */
export async function registrarAparelho(sub: AssinaturaPush, userAgent: string): Promise<Resultado<{ aparelhos: number }>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (!sub?.endpoint?.startsWith('https://') || !sub.keys?.p256dh || !sub.keys?.auth) return falha('Este aparelho não devolveu os dados do aviso. Tente de novo.');
  const antigo = await c.db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  if (antigo.error) return falha(mensagem(antigo.error));
  const { error } = await c.db
    .from('push_subscriptions')
    .insert({ user_id: c.userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: userAgent.slice(0, 300) });
  if (error) return falha(mensagem(error));
  const { count } = await c.db.from('push_subscriptions').select('id', { count: 'exact', head: true });
  return { ok: true, dados: { aparelhos: count ?? 1 } };
}

export async function removerAparelho(endpoint: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const { error } = await c.db.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return error ? falha(mensagem(error)) : { ok: true, dados: null };
}

/** Marca como lidos os avisos pedidos (ou todos). */
export async function marcarLidos(ids?: number[]): Promise<Resultado<{ naoLidos: number }>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  let q = c.db.from('admin_notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (ids) q = q.in('id', ids);
  const { error } = await q;
  if (error) return falha(mensagem(error));
  const n = await contarNaoLidos();
  return { ok: true, dados: { naoLidos: n ?? 0 } };
}

/** Cria um aviso de teste e o envia a todos os aparelhos cadastrados (o iPhone da dona, o computador…). */
export async function enviarTeste(): Promise<Resultado<{ resumo: ResumoEnvio; configurado: boolean }>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const { data: aviso, error } = await c.db
    .from('admin_notifications')
    .insert({ kind: 'teste', title: 'Aviso de teste', body: 'Se você está vendo isto, os avisos estão funcionando neste aparelho.', url: '/admin?aba=avisos' })
    .select('id, title, body, url')
    .single();
  if (error) return falha(mensagem(error));
  const naoLidos = (await contarNaoLidos()) ?? 1;
  const resumo = await enviarPushAvisos(c.db, aviso, naoLidos);
  return { ok: true, dados: { resumo, configurado: pushConfigurado() } };
}
