import { definirVideoSite } from '../app/admin/configuracoes-acoes';
import { BUCKET_VIDEOS } from '../lib/fotos';
import { supabaseNavegador } from '../lib/supabase/browser';
import { mb, prepararVideo } from './video';

/** Comprime no navegador (sem som, 720p), envia a "site/" do bucket de vídeos e põe no espaço da loja. */
export async function enviarVideoSite(arquivo: File, slot: string, alt: string, progresso: (texto: string) => void) {
  const v = await prepararVideo(arquivo, progresso);
  const caminhoVideo = `site/${crypto.randomUUID()}.mp4`;
  const caminhoCapa = `site/${crypto.randomUUID()}.${v.extensaoCapa}`;
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
  const r = await definirVideoSite(slot, caminhoVideo, caminhoCapa, alt);
  if (!r.ok) throw new Error(r.erro);
  return { antes: v.tamanhoOriginal, depois: v.video.size };
}
