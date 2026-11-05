// Endereço público das fotos dos produtos (bucket "produtos", leitura pública).
// Cada foto tem duas versões: a grande (caminho salvo no banco) e a pequena, com "-p" antes da extensão.

export const BUCKET_FOTOS = 'produtos';

/** "abc/123.webp" → "abc/123-p.webp" */
export const caminhoPequeno = (caminho: string) => caminho.replace(/(\.[a-z0-9]+)$/i, '-p$1');

export function urlFoto(caminho: string, tamanho: 'g' | 'p' = 'g'): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const c = tamanho === 'p' ? caminhoPequeno(caminho) : caminho;
  return `${base}/storage/v1/object/public/${BUCKET_FOTOS}/${c.split('/').map(encodeURIComponent).join('/')}`;
}

// Vídeos curtos dos produtos (bucket "videos-produtos", leitura pública): o MP4 e a capa tirada dele.
export const BUCKET_VIDEOS = 'videos-produtos';

export function urlVideo(caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET_VIDEOS}/${caminho.split('/').map(encodeURIComponent).join('/')}`;
}
