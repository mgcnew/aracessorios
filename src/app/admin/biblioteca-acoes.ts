'use server';
import { supabaseServidor } from '../../lib/supabase/server';
import { mensagemDoBanco, termoBusca } from '../../admin/produtos';
import { FOTOS_POR_PAGINA, type PaginaBiblioteca } from '../../admin/biblioteca-dados';
import { BUCKET_FOTOS, caminhoPequeno } from '../../lib/fotos';
import type { Resultado } from './produtos-acoes';

async function acesso() {
  const db = await supabaseServidor();
  const { data: admin, error } = await db.rpc('is_admin');
  return !error && admin === true ? db : null;
}
const falha = (erro: string) => ({ ok: false as const, erro });
export async function carregarBiblioteca(pagina = 1, busca = ''): Promise<Resultado<PaginaBiblioteca>> {
  const db = await acesso();
  if (!db) return falha('Acesso restrito ao painel. Entre de novo.');
  const pg = Number.isSafeInteger(pagina) ? Math.max(1, pagina) : 1;
  let q = db.from('media_assets').select('*', { count: 'exact' }).order('created_at', { ascending: false }).order('id');
  const termo = termoBusca(busca);
  if (termo) q = q.ilike('name', `%${termo}%`);
  const r = await q.range((pg - 1) * FOTOS_POR_PAGINA, pg * FOTOS_POR_PAGINA - 1);
  if (r.error) return falha(mensagemDoBanco(r.error));
  if (!r.data.length) return { ok: true, dados: { fotos: [], total: r.count ?? 0 } };
  const vinculos = await db.from('product_images').select('storage_path, products (id, name)').in('storage_path', r.data.map(f => f.storage_path));
  if (vinculos.error) return falha(mensagemDoBanco(vinculos.error));
  return { ok: true, dados: { total: r.count ?? 0, fotos: r.data.map(f => ({ ...f,
    produtos: vinculos.data.filter(v => v.storage_path === f.storage_path).flatMap(v => v.products ? [v.products] : []),
  })) } };
}
export async function registrarMidia(caminho: string, nome: string) {
  const db = await acesso();
  if (!db) return falha('Acesso restrito ao painel.');
  const name = nome.trim().slice(0, 200);
  if (!name || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/.test(caminho)) return falha('Nome ou caminho da foto inválido.');
  const [pasta, arquivo] = caminho.split('/');
  const lista = await db.storage.from(BUCKET_FOTOS).list(pasta, { search: arquivo.split('.')[0], limit: 10 });
  if (lista.error) return falha(lista.error.message);
  if (![arquivo, caminhoPequeno(arquivo)].every(a => lista.data.some(f => f.name === a))) return falha('O envio das duas versões da foto não foi concluído.');
  const r = await db.from('media_assets').insert({ storage_path: caminho, name, default_alt: name }).select('id').single();
  return r.error ? falha(mensagemDoBanco(r.error)) : { ok: true as const, dados: r.data };
}
export async function descreverMidia(id: string, nome: string, descricao: string) {
  const db = await acesso();
  if (!db) return falha('Acesso restrito ao painel.');
  const name = nome.trim(), default_alt = descricao.trim();
  if (!name || name.length > 200 || !default_alt || default_alt.length > 200) return falha('Nome e descrição devem ter de 1 a 200 caracteres.');
  const r = await db.from('media_assets').update({ name, default_alt }).eq('id', id).eq('deleting', false).select('id').single();
  return r.error ? falha(mensagemDoBanco(r.error)) : { ok: true as const, dados: r.data };
}
export async function excluirMidia(id: string) {
  const db = await acesso();
  if (!db) return falha('Acesso restrito ao painel.');
  const inicio = await db.rpc('iniciar_exclusao_midia', { p_id: id });
  if (inicio.error) return falha(mensagemDoBanco(inicio.error));
  const arquivos = await db.storage.from(BUCKET_FOTOS).remove([inicio.data, caminhoPequeno(inicio.data)]);
  if (arquivos.error) return falha('A exclusão ficou pendente. Use Retomar exclusão para tentar novamente.');
  // O banco confirma ausência dos dois arquivos; aceita repetição após falha parcial.
  const fim = await db.rpc('finalizar_exclusao_midia', { p_id: id });
  return fim.error ? falha(mensagemDoBanco(fim.error)) : { ok: true as const, dados: null };
}
