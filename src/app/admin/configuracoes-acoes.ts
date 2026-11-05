'use server';

import { updateTag } from 'next/cache';
import { apenasDigitos, formatarCnpj, type DadosEmpresa, type PaginaConfiguracoes } from '../../admin/configuracoes';
import { mensagemDoBanco } from '../../admin/produtos';
import { ESPACOS_FIXOS } from '../../data/site-espacos';
import { limparTexto, TEXTO_POR_CHAVE } from '../../data/site-textos';
import { TAG_CATALOGO } from '../../lib/cache';
import { BUCKET_VIDEOS } from '../../lib/fotos';
import { supabaseServidor } from '../../lib/supabase/server';
import type { Resultado } from './produtos-acoes';

const falha = (erro: string) => ({ ok: false as const, erro });
const CAMINHO_VIDEO = /^site\/[0-9a-f-]{36}\.mp4$/;
const CAMINHO_CAPA = /^site\/[0-9a-f-]{36}\.(webp|jpg)$/;

function mensagem(erro: { code?: string; message: string }): string {
  if (erro.code === '42P01' || erro.code === 'PGRST205' || /schema cache|does not exist/i.test(erro.message))
    return 'As configurações ainda não existem no banco. Aplique supabase/migrations/20261105110000_configuracoes_site.sql e 20261105120000_textos_site.sql no SQL Editor.';
  return mensagemDoBanco(erro);
}

async function cliente() {
  const db = await supabaseServidor();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { ok: false as const, erro: 'Sua sessão expirou. Entre de novo.' };
  const { data: admin } = await db.rpc('is_admin');
  if (admin !== true) return { ok: false as const, erro: 'Acesso restrito ao painel.' };
  return { ok: true as const, db, email: auth.user.email ?? '' };
}
type Db = Extract<Awaited<ReturnType<typeof cliente>>, { ok: true }>['db'];

/** O espaço existe? Os fixos vêm da lista do site; os de categoria, das categorias cadastradas. */
async function espacoValido(db: Db, slot: string): Promise<{ video: boolean } | null> {
  const fixo = ESPACOS_FIXOS.find((x) => x.slot === slot);
  if (fixo) return { video: fixo.video };
  const m = /^categoria-([a-z0-9-]{1,40})$/.exec(slot);
  if (!m) return null;
  const c = await db.from('categories').select('id').eq('slug', m[1]).maybeSingle();
  return c.data ? { video: false } : null;
}

export async function carregarConfiguracoes(): Promise<Resultado<PaginaConfiguracoes>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const [midia, empresa, cats, textos] = await Promise.all([
    c.db.from('site_media').select('*'),
    c.db.from('site_settings').select('*').maybeSingle(),
    c.db.from('categories').select('slug, name').order('position'),
    c.db.from('site_texts').select('key, value'),
  ]);
  for (const r of [midia, empresa, cats]) if (r.error) return falha(mensagem(r.error));
  if (!empresa.data) return falha('Os dados da empresa não foram criados. Aplique a migração das configurações.');
  return {
    ok: true,
    dados: { midia: Object.fromEntries((midia.data ?? []).map((m) => [m.slot, m])), empresa: empresa.data, categorias: cats.data ?? [], email: c.email, textos: Object.fromEntries((textos.data ?? []).map((t) => [t.key, t.value])), textosPronto: !textos.error },
  };
}

/** Apaga do Storage os arquivos de um vídeo que deixou de ser usado (sem falhar a ação se não der). */
async function limparVideoAntigo(db: Db, antigo: { kind: string; storage_path: string; poster_path: string | null } | null) {
  if (antigo?.kind === 'video' && antigo.poster_path) await db.storage.from(BUCKET_VIDEOS).remove([antigo.storage_path, antigo.poster_path]);
}

const altOk = (alt: string) => alt.trim().length >= 1 && alt.trim().length <= 200;

/** Põe uma foto da biblioteca no espaço da loja. A descrição (alt) começa com a da biblioteca. */
export async function definirImagemSite(slot: string, midiaId: string, alt: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (!(await espacoValido(c.db, slot))) return falha('Espaço desconhecido.');
  const midia = await c.db.from('media_assets').select('storage_path, default_alt').eq('id', midiaId).eq('deleting', false).maybeSingle();
  if (midia.error) return falha(mensagem(midia.error));
  if (!midia.data) return falha('Foto não encontrada na biblioteca.');
  const descricao = (alt.trim() || midia.data.default_alt).slice(0, 200);
  const antigo = await c.db.from('site_media').select('kind, storage_path, poster_path').eq('slot', slot).maybeSingle();
  const { error } = await c.db.from('site_media').upsert({ slot, kind: 'imagem', storage_path: midia.data.storage_path, poster_path: null, alt: descricao }, { onConflict: 'slot' });
  if (error) return falha(mensagem(error));
  await limparVideoAntigo(c.db, antigo.data);
  updateTag(TAG_CATALOGO);
  return { ok: true, dados: null };
}

/** Registra o vídeo que o navegador acabou de enviar (mesma compressão do vídeo do produto). */
export async function definirVideoSite(slot: string, caminhoVideo: string, caminhoCapa: string, alt: string): Promise<Resultado<null>> {
  const c = await cliente();
  const limpar = () => c.ok && c.db.storage.from(BUCKET_VIDEOS).remove([caminhoVideo, caminhoCapa]);
  if (!c.ok) return falha(c.erro);
  const espaco = await espacoValido(c.db, slot);
  if (!espaco) {
    await limpar();
    return falha('Espaço desconhecido.');
  }
  if (!espaco.video) {
    await limpar();
    return falha('Este espaço só aceita imagem.');
  }
  if (!CAMINHO_VIDEO.test(caminhoVideo) || !CAMINHO_CAPA.test(caminhoCapa)) return falha('Caminho do vídeo inválido.');
  if (!altOk(alt)) {
    await limpar();
    return falha('Descreva o vídeo (até 200 letras).');
  }
  const antigo = await c.db.from('site_media').select('kind, storage_path, poster_path').eq('slot', slot).maybeSingle();
  const { error } = await c.db.from('site_media').upsert({ slot, kind: 'video', storage_path: caminhoVideo, poster_path: caminhoCapa, alt: alt.trim() }, { onConflict: 'slot' });
  if (error) {
    await limpar();
    return falha(mensagem(error));
  }
  await limparVideoAntigo(c.db, antigo.data);
  updateTag(TAG_CATALOGO);
  return { ok: true, dados: null };
}

export async function descreverEspaco(slot: string, alt: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (!altOk(alt)) return falha('A descrição vai de 1 a 200 letras.');
  const { data, error } = await c.db.from('site_media').update({ alt: alt.trim() }).eq('slot', slot).select('slot');
  if (error) return falha(mensagem(error));
  if (!data?.length) return falha('Escolha uma imagem para este espaço antes de descrevê-la.');
  updateTag(TAG_CATALOGO);
  return { ok: true, dados: null };
}

/** Volta o espaço para a imagem padrão do site. A foto continua na biblioteca; um vídeo é apagado. */
export async function restaurarEspaco(slot: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const { data, error } = await c.db.from('site_media').delete().eq('slot', slot).select('kind, storage_path, poster_path');
  if (error) return falha(mensagem(error));
  await limparVideoAntigo(c.db, data?.[0] ?? null);
  updateTag(TAG_CATALOGO);
  return { ok: true, dados: null };
}

const limpo = (t: string, max: number) => t.trim().slice(0, max);

export async function salvarEmpresa(d: DadosEmpresa): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  const cnpj = d.cnpj.trim() ? formatarCnpj(d.cnpj) : '';
  const whatsapp = apenasDigitos(d.whatsapp);
  const instagram = d.instagram.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
  if (!limpo(d.store_name, 80)) return falha('Informe o nome da loja.');
  if (cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj)) return falha('CNPJ inválido: informe os 14 números.');
  if (d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return falha('E-mail inválido.');
  if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) return falha('WhatsApp: informe com DDD, só números (ex.: 11999990000).');
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return falha('Instagram: informe só o nome de usuário (ex.: ar.acessorios).');
  const { error } = await c.db
    .from('site_settings')
    .update({
      store_name: limpo(d.store_name, 80),
      legal_name: limpo(d.legal_name, 120),
      cnpj,
      email: d.email.trim(),
      phone: limpo(d.phone, 30),
      whatsapp,
      instagram,
      address: limpo(d.address, 200),
      hours: limpo(d.hours, 120),
    })
    .eq('id', true);
  if (error) return falha(mensagem(error));
  updateTag(TAG_CATALOGO);
  return { ok: true, dados: null };
}

/**
 * Salva os textos alterados de uma vez (tudo ou nada). Texto igual ao padrão do site, ou em branco, apaga a linha:
 * a loja volta ao padrão. Cada texto respeita o limite de caracteres de src/data/site-textos.ts.
 */
export async function salvarTextos(entradas: { chave: string; valor: string }[]): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (!entradas.length) return falha('Nenhum texto foi alterado.');
  const gravar: { key: string; value: string }[] = [];
  const apagar: string[] = [];
  for (const e of entradas) {
    const t = TEXTO_POR_CHAVE[e.chave];
    if (!t) return falha('Texto desconhecido.');
    const r = limparTexto(t, e.valor);
    if (!r.ok) return falha(r.erro);
    if (r.valor === '' || r.valor === t.padrao) apagar.push(e.chave);
    else gravar.push({ key: e.chave, value: r.valor });
  }
  if (gravar.length) {
    const { error } = await c.db.from('site_texts').upsert(gravar, { onConflict: 'key' });
    if (error) return falha(mensagem(error));
  }
  if (apagar.length) {
    const { error } = await c.db.from('site_texts').delete().in('key', apagar);
    if (error) return falha(mensagem(error));
  }
  updateTag(TAG_CATALOGO);
  return { ok: true, dados: null };
}

/** Troca a senha de quem está logado no painel. */
export async function alterarSenha(nova: string, confirmacao: string): Promise<Resultado<null>> {
  const c = await cliente();
  if (!c.ok) return falha(c.erro);
  if (nova.length < 8) return falha('A senha nova precisa de pelo menos 8 caracteres.');
  if (nova !== confirmacao) return falha('A confirmação não é igual à senha nova.');
  const { error } = await c.db.auth.updateUser({ password: nova });
  if (error) return falha(error.message.includes('different') ? 'A senha nova precisa ser diferente da atual.' : 'Não foi possível trocar a senha agora. Entre de novo e tente outra vez.');
  return { ok: true, dados: null };
}
