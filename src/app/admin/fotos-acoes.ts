'use server';

import { updateTag } from 'next/cache';
import { mensagemDoBanco, type CatalogoPainel } from '../../admin/produtos';
import { TAG_CATALOGO } from '../../lib/cache';
import { BUCKET_FOTOS, caminhoPequeno } from '../../lib/fotos';
import { supabaseServidor } from '../../lib/supabase/server';
import { carregarProduto, type Resultado } from './produtos-acoes';

const falha = (erro: string) => ({ ok: false as const, erro });
const CAMINHO_OK = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/;

/** Devolve só o produto das fotos e expira o cache da vitrine. */
async function recarregar(productId: string): Promise<Resultado<CatalogoPainel>> {
  updateTag(TAG_CATALOGO);
  const r = await carregarProduto(productId);
  if (!r.ok) return r;
  return { ok: true, dados: { categorias: [], produtos: r.dados ? [r.dados] : [] } };
}

function altValido(alt: string): { erro: string } | { alt: string } {
  const t = alt.trim();
  if (!t) return { erro: 'Descreva a foto (texto alternativo), ex.: "Brinco Gota Aurora dourado na orelha".' };
  if (t.length > 200) return { erro: 'Texto alternativo: até 200 caracteres.' };
  return { alt: t };
}

/**
 * Registra no banco uma foto que o navegador acabou de enviar ao Storage.
 * Se o registro falhar, apaga os arquivos enviados para não sobrar foto órfã.
 */
export async function registrarFoto(productId: string, caminho: string, alt: string) {
  // Caminho fora do padrão: recusa sem apagar nada (não é um arquivo que este painel enviou).
  if (!CAMINHO_OK.test(caminho) || !caminho.startsWith(`${productId}/`)) return falha('Caminho da foto inválido.');

  const db = await supabaseServidor();
  const removerArquivos = () => db.storage.from(BUCKET_FOTOS).remove([caminho, caminhoPequeno(caminho)]);

  const a = altValido(alt);
  if ('erro' in a) {
    await removerArquivos();
    return falha(a.erro);
  }

  const existentes = await db.from('product_images').select('position, is_cover').eq('product_id', productId);
  if (existentes.error) {
    await removerArquivos();
    return falha(mensagemDoBanco(existentes.error));
  }
  const position = Math.max(-1, ...existentes.data.map((f) => f.position)) + 1;
  const is_cover = !existentes.data.some((f) => f.is_cover);

  const { error } = await db.from('product_images').insert({ product_id: productId, storage_path: caminho, alt: a.alt, position, is_cover });
  if (error) {
    await removerArquivos();
    return falha(mensagemDoBanco(error));
  }
  return recarregar(productId);
}

export async function salvarAlt(fotoId: string, alt: string) {
  const a = altValido(alt);
  if ('erro' in a) return falha(a.erro);
  const db = await supabaseServidor();
  const { data, error } = await db.from('product_images').update({ alt: a.alt }).eq('id', fotoId).select('product_id').single();
  if (error) return falha(mensagemDoBanco(error));
  return recarregar(data.product_id);
}

/** Uma capa por produto (o banco garante): tira a atual, marca a nova e a põe em primeiro. */
export async function definirCapa(fotoId: string) {
  const db = await supabaseServidor();
  const foto = await db.from('product_images').select('product_id').eq('id', fotoId).single();
  if (foto.error) return falha(mensagemDoBanco(foto.error));
  const productId = foto.data.product_id;
  const tirar = await db.from('product_images').update({ is_cover: false }).eq('product_id', productId).eq('is_cover', true);
  if (tirar.error) return falha(mensagemDoBanco(tirar.error));
  const { error } = await db.from('product_images').update({ is_cover: true }).eq('id', fotoId);
  if (error) return falha(mensagemDoBanco(error));

  const todas = await db.from('product_images').select('id').eq('product_id', productId).order('position');
  if (todas.error) return falha(mensagemDoBanco(todas.error));
  const ids = [fotoId, ...todas.data.map((f) => f.id).filter((id) => id !== fotoId)];
  return ordenarFotos(productId, ids);
}

/** Grava a nova ordem das fotos (lista de ids, na ordem desejada). */
export async function ordenarFotos(productId: string, ids: string[]) {
  const db = await supabaseServidor();
  const atuais = await db.from('product_images').select('id').eq('product_id', productId);
  if (atuais.error) return falha(mensagemDoBanco(atuais.error));
  const mesmas = new Set(atuais.data.map((f) => f.id));
  if (ids.length !== mesmas.size || ids.some((id) => !mesmas.has(id))) return falha('A lista de fotos mudou. Recarregue a página.');
  for (const [position, id] of ids.entries()) {
    const { error } = await db.from('product_images').update({ position }).eq('id', id);
    if (error) return falha(mensagemDoBanco(error));
  }
  return recarregar(productId);
}

/** Apaga o registro e os dois arquivos. Se era a capa, a próxima foto vira capa. */
export async function apagarFoto(fotoId: string) {
  const db = await supabaseServidor();
  const { data, error } = await db.from('product_images').delete().eq('id', fotoId).select('product_id, storage_path, is_cover');
  if (error) return falha(mensagemDoBanco(error));
  const foto = data?.[0];
  if (!foto) return falha('Foto não encontrada.');

  const caminhos = [foto.storage_path, caminhoPequeno(foto.storage_path)];
  const arquivos = await db.storage.from(BUCKET_FOTOS).remove(caminhos);

  if (foto.is_cover) {
    const proxima = await db
      .from('product_images')
      .select('id')
      .eq('product_id', foto.product_id)
      .order('position')
      .limit(1);
    if (proxima.data?.[0]) await db.from('product_images').update({ is_cover: true }).eq('id', proxima.data[0].id);
  }
  const r = await recarregar(foto.product_id);
  // O registro já saiu: devolve a lista atualizada e, se sobrou arquivo, um aviso (remove() não dá erro quando não acha).
  const saiu = arquivos.data?.length ?? 0;
  const aviso =
    arquivos.error || saiu < caminhos.length
      ? `Foto tirada do produto, mas ${caminhos.length - saiu} arquivo(s) ficaram no armazenamento${arquivos.error ? `: ${arquivos.error.message}` : ''}.`
      : undefined;
  return r.ok ? { ok: true as const, dados: { ...r.dados, aviso } } : r;
}
