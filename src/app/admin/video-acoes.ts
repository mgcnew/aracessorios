'use server';

import { updateTag } from 'next/cache';
import { mensagemDoBanco, type CatalogoPainel } from '../../admin/produtos';
import { TAG_CATALOGO } from '../../lib/cache';
import { BUCKET_VIDEOS } from '../../lib/fotos';
import { supabaseServidor } from '../../lib/supabase/server';
import { carregarProduto, type Resultado } from './produtos-acoes';

const falha = (erro: string) => ({ ok: false as const, erro });
const UUID = '[0-9a-f-]{36}';
const CAMINHO_VIDEO = new RegExp(`^(${UUID})/${UUID}\\.mp4$`);
const CAMINHO_CAPA = new RegExp(`^(${UUID})/${UUID}\\.(webp|jpg)$`);

async function recarregar(productId: string): Promise<Resultado<CatalogoPainel>> {
  updateTag(TAG_CATALOGO);
  const r = await carregarProduto(productId);
  if (!r.ok) return r;
  return { ok: true, dados: { categorias: [], produtos: r.dados ? [r.dados] : [] } };
}

/**
 * Registra o vídeo que o navegador acabou de enviar ao Storage. Cada produto tem um só: o anterior,
 * se existir, é trocado e seus arquivos são apagados. Se o registro falhar, os arquivos novos são removidos.
 */
export async function registrarVideo(productId: string, caminhoVideo: string, caminhoCapa: string, duracaoMs: number, tamanho: number) {
  const db = await supabaseServidor();
  const limpar = (...c: string[]) => db.storage.from(BUCKET_VIDEOS).remove(c);

  // Os arquivos precisam estar na pasta do próprio produto, para um vídeo não ser registrado no produto errado.
  const v = CAMINHO_VIDEO.exec(caminhoVideo);
  const c = CAMINHO_CAPA.exec(caminhoCapa);
  if (!v || !c || v[1] !== productId || c[1] !== productId) {
    return falha('Caminho do vídeo inválido.');
  }
  if (!Number.isInteger(duracaoMs) || !Number.isInteger(tamanho)) {
    await limpar(caminhoVideo, caminhoCapa);
    return falha('Dados do vídeo inválidos.');
  }

  const antigo = await db.from('product_videos').select('storage_path, poster_path').eq('product_id', productId).maybeSingle();
  if (antigo.error) {
    await limpar(caminhoVideo, caminhoCapa);
    return falha(mensagemDoBanco(antigo.error));
  }
  const campos = { product_id: productId, storage_path: caminhoVideo, poster_path: caminhoCapa, duration_ms: duracaoMs, size_bytes: tamanho };
  const { error } = await db.from('product_videos').upsert(campos, { onConflict: 'product_id' });
  if (error) {
    await limpar(caminhoVideo, caminhoCapa);
    return falha(mensagemDoBanco(error));
  }
  if (antigo.data) await limpar(antigo.data.storage_path, antigo.data.poster_path);
  return recarregar(productId);
}

/** Tira o vídeo do produto e apaga os arquivos (diferente das fotos, o vídeo não vai para a biblioteca). */
export async function apagarVideo(productId: string) {
  const db = await supabaseServidor();
  const { data, error } = await db.from('product_videos').delete().eq('product_id', productId).select('storage_path, poster_path');
  if (error) return falha(mensagemDoBanco(error));
  updateTag(TAG_CATALOGO);
  let aviso: string | undefined;
  for (const v of data) {
    const r = await db.storage.from(BUCKET_VIDEOS).remove([v.storage_path, v.poster_path]);
    if (r.error) aviso = 'O vídeo saiu do produto, mas o arquivo ficou guardado no armazenamento.';
  }
  const r = await recarregar(productId);
  return r.ok && aviso ? { ok: true as const, dados: { ...r.dados, aviso } } : r;
}
