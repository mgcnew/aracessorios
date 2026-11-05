import { registrarVideo } from '../app/admin/video-acoes';
import { BUCKET_VIDEOS } from '../lib/fotos';
import { supabaseNavegador } from '../lib/supabase/browser';
import { mb, prepararVideo } from './video';

/** Comprime no navegador, envia o MP4 e a capa direto ao Storage e registra no produto. */
export async function enviarVideo(arquivo: File, productId: string, progresso: (texto: string) => void) {
  const v = await prepararVideo(arquivo, progresso);
  const base = `${productId}/${crypto.randomUUID()}`;
  const caminhoVideo = `${base}.mp4`;
  const caminhoCapa = `${productId}/${crypto.randomUUID()}.${v.extensaoCapa}`;
  const storage = supabaseNavegador().storage.from(BUCKET_VIDEOS);
  const opcoes = { cacheControl: '31536000', upsert: false };

  progresso(`Enviando vídeo (${mb(v.video.size)})…`);
  const a = await storage.upload(caminhoVideo, v.video, { ...opcoes, contentType: 'video/mp4' });
  if (a.error) throw new Error(a.error.message);
  const b = await storage.upload(caminhoCapa, v.capa, { ...opcoes, contentType: v.capaTipo });
  if (b.error) {
    await storage.remove([caminhoVideo]);
    throw new Error(b.error.message);
  }
  const r = await registrarVideo(productId, caminhoVideo, caminhoCapa, v.duracaoMs, v.video.size);
  if (!r.ok) throw new Error(r.erro);
  return { catalogo: r.dados, antes: v.tamanhoOriginal, depois: v.video.size };
}
