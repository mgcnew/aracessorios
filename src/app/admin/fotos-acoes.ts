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
 * Fotos já guardadas na biblioteca são preservadas se o vínculo falhar.
 */
export async function registrarFoto(productId: string, caminho: string, alt: string) {
  // Caminho fora do padrão: recusa sem apagar nada. Mídia existente pode vir de outro produto.
  if (!CAMINHO_OK.test(caminho)) return falha('Caminho da foto inválido.');

  const db = await supabaseServidor();
  const removerArquivos = async () => {
    const existe = await db.from('media_assets').select('id').eq('storage_path', caminho).maybeSingle();
    if (!existe.error && !existe.data) await db.storage.from(BUCKET_FOTOS).remove([caminho, caminhoPequeno(caminho)]);
  };

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

/** Retira só o vínculo; o arquivo continua na biblioteca. */
export async function apagarFoto(fotoId: string) {
  const db = await supabaseServidor();
  const { data: foto, error } = await db.from('product_images').delete().eq('id', fotoId).select('product_id, is_cover').single();
  if (error) return falha(mensagemDoBanco(error));
  updateTag(TAG_CATALOGO);
  if (foto.is_cover) {
    const proxima = await db.from('product_images').select('id').eq('product_id', foto.product_id).order('position').limit(1);
    if (proxima.error) return falha(mensagemDoBanco(proxima.error));
    if (proxima.data[0]) {
      const capa = await db.from('product_images').update({ is_cover: true }).eq('id', proxima.data[0].id);
      if (capa.error) return falha(mensagemDoBanco(capa.error));
    }
  }
  return recarregar(foto.product_id);
}

/** Reutiliza uma imagem já registrada, mantendo descrição/capa/ordem por produto. */
export async function vincularMidia(productId: string, midiaId: string) {
  const db = await supabaseServidor();
  const { data: admin } = await db.rpc('is_admin');
  if (admin !== true) return falha('Acesso restrito ao painel.');
  const midia = await db.from('media_assets').select('storage_path, default_alt').eq('id', midiaId).eq('deleting', false).single();
  if (midia.error) return falha(mensagemDoBanco(midia.error));
  return registrarFoto(productId, midia.data.storage_path, midia.data.default_alt);
}
