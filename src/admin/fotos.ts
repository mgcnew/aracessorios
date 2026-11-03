// Prepara as fotos no navegador antes do envio: duas versões menores, em WebP
// (ou JPEG, se o navegador não gerar WebP). Redesenhar a imagem num canvas
// descarta os dados escondidos do arquivo original, como a localização GPS.

export const TAMANHO_GRANDE = 1600;
export const TAMANHO_PEQUENO = 600;
const LIMITE_BUCKET = 5 * 1024 * 1024; // igual ao limite do bucket "produtos"
const LIMITE_ORIGINAL = 30 * 1024 * 1024;

export interface FotoPronta {
  grande: Blob;
  pequena: Blob;
  extensao: 'webp' | 'jpg';
  tipo: 'image/webp' | 'image/jpeg';
  largura: number;
  altura: number;
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((ok) => canvas.toBlob(ok, tipo, qualidade));
}

function desenhar(img: ImageBitmap, lado: number): HTMLCanvasElement {
  const escala = Math.min(1, lado / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * escala));
  const h = Math.max(1, Math.round(img.height * escala));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador não consegue preparar a foto.');
  // Fundo claro para PNG com transparência (JPEG não tem transparência).
  ctx.fillStyle = '#FDF6F0';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

async function codificar(canvas: HTMLCanvasElement, preferirWebp: boolean) {
  for (const qualidade of [0.85, 0.75, 0.6]) {
    let blob = preferirWebp ? await paraBlob(canvas, 'image/webp', qualidade) : null;
    // Alguns navegadores (Safari antigo) devolvem PNG quando não sabem gerar WebP.
    if (!blob || blob.type !== 'image/webp') blob = await paraBlob(canvas, 'image/jpeg', qualidade);
    if (!blob) throw new Error('Não foi possível preparar a foto.');
    if (blob.size <= LIMITE_BUCKET) return blob;
  }
  throw new Error('A foto ficou grande demais mesmo reduzida. Tente outra.');
}

export async function prepararFoto(arquivo: File): Promise<FotoPronta> {
  if (!arquivo.type.startsWith('image/')) throw new Error(`"${arquivo.name}" não é uma imagem.`);
  if (arquivo.size > LIMITE_ORIGINAL) throw new Error(`"${arquivo.name}" passa de 30 MB.`);

  let img: ImageBitmap;
  try {
    img = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`Não foi possível abrir "${arquivo.name}". Use JPG, PNG ou WebP.`);
  }
  try {
    if (Math.min(img.width, img.height) < 400) throw new Error(`"${arquivo.name}" é pequena demais (mínimo de 400 px no menor lado).`);
    const grande = await codificar(desenhar(img, TAMANHO_GRANDE), true);
    const webp = grande.type === 'image/webp';
    const pequena = await codificar(desenhar(img, TAMANHO_PEQUENO), webp);
    return {
      grande,
      pequena,
      extensao: webp ? 'webp' : 'jpg',
      tipo: webp ? 'image/webp' : 'image/jpeg',
      largura: img.width,
      altura: img.height,
    };
  } finally {
    img.close();
  }
}
