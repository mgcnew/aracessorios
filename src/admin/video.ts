// Prepara o vídeo do produto no navegador antes do envio: MP4 (H.264) sem som, no máximo 720p e 30 s.
// Tirar o som e baixar a resolução é o que mais pesa na conta: um vídeo de celular de 40 MB sai com 2 a 5 MB.
// Usa a codificação do próprio navegador (WebCodecs), então nada passa pelo servidor.
import { ALL_FORMATS, BlobSource, BufferTarget, CanvasSink, Conversion, Input, Mp4OutputFormat, Output, canEncodeVideo } from 'mediabunny';

export const DURACAO_MAX_S = 30;
export const LIMITE_FINAL = 15 * 1024 * 1024; // igual ao limite do bucket "videos-produtos"
const LIMITE_ORIGINAL = 500 * 1024 * 1024;
// Lado menor de 720 px (e o maior até 1280): nítido no celular sem pesar.
const LADO_MENOR = 720;
const LADO_MAIOR = 1280;
const BITRATES = [1_600_000, 1_000_000, 600_000];
const POSTER_LADO = 900;

export interface VideoPronto {
  video: Blob;
  capa: Blob;
  capaTipo: 'image/webp' | 'image/jpeg';
  extensaoCapa: 'webp' | 'jpg';
  duracaoMs: number;
  largura: number;
  altura: number;
  tamanhoOriginal: number;
}

export const suportaVideo = () => typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';

function paraBlob(canvas: HTMLCanvasElement | OffscreenCanvas, tipo: string, qualidade: number): Promise<Blob | null> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type: tipo, quality: qualidade }).catch(() => null);
  return new Promise((ok) => canvas.toBlob(ok, tipo, qualidade));
}

/** Medidas de saída: cabe em 720 x 1280 (ou 1280 x 720), sem ampliar, sempre pares (exigência do H.264). */
function medidas(w: number, h: number) {
  const menor = Math.min(w, h);
  const maior = Math.max(w, h);
  const escala = Math.min(1, LADO_MENOR / menor, LADO_MAIOR / maior);
  const par = (n: number) => Math.max(2, Math.round((n * escala) / 2) * 2);
  return { largura: par(w), altura: par(h) };
}

export async function prepararVideo(arquivo: File, progresso: (texto: string) => void): Promise<VideoPronto> {
  if (!suportaVideo())
    throw new Error('Este navegador não consegue preparar vídeos. Use o Chrome, Edge ou Safari atualizados, no computador ou no celular.');
  if (!arquivo.type.startsWith('video/')) throw new Error(`"${arquivo.name}" não é um vídeo.`);
  if (arquivo.size > LIMITE_ORIGINAL) throw new Error(`"${arquivo.name}" passa de 500 MB.`);

  const entrada = new Input({ source: new BlobSource(arquivo), formats: ALL_FORMATS });
  try {
    const faixa = await entrada.getPrimaryVideoTrack().catch(() => null);
    if (!faixa) throw new Error(`Não foi possível abrir "${arquivo.name}". Use um vídeo MP4 ou MOV.`);
    if (!(await faixa.canDecode())) throw new Error('Este navegador não consegue ler esse formato de vídeo. Tente um MP4 (H.264).');
    const duracao = await entrada.computeDuration();
    if (!(duracao > 0.5)) throw new Error('O vídeo é curto demais (mínimo de meio segundo).');
    if (duracao > DURACAO_MAX_S + 0.5) throw new Error(`O vídeo tem ${Math.round(duracao)} s e o máximo é ${DURACAO_MAX_S} s. Corte antes de enviar.`);

    const { largura, altura } = medidas(faixa.displayWidth, faixa.displayHeight);
    if (!(await canEncodeVideo('avc', { width: largura, height: altura, bitrate: BITRATES[0] })))
      throw new Error('Este aparelho não consegue gerar vídeo H.264. Tente de outro computador ou celular.');

    // Capa: um quadro do próprio vídeo (perto do começo, onde costuma estar a peça).
    progresso('Gerando a capa…');
    const quadro = await new CanvasSink(faixa, { width: Math.min(POSTER_LADO, Math.max(largura, altura)), fit: 'contain' }).getCanvas(Math.min(1, duracao / 3));
    if (!quadro) throw new Error('Não foi possível tirar a capa do vídeo.');
    let capa = await paraBlob(quadro.canvas, 'image/webp', 0.8);
    let capaTipo: 'image/webp' | 'image/jpeg' = 'image/webp';
    if (!capa || capa.type !== 'image/webp') {
      capa = await paraBlob(quadro.canvas, 'image/jpeg', 0.8);
      capaTipo = 'image/jpeg';
    }
    if (!capa) throw new Error('Não foi possível gerar a capa do vídeo.');

    // 30 quadros por segundo bastam; vídeo de 60 fps pesaria o dobro sem ganho para a vitrine.
    const stats = await faixa.computePacketStats(60).catch(() => null);
    const frameRate = stats && stats.averagePacketRate > 31 ? 30 : undefined;

    // Começa com boa qualidade e só baixa o bitrate se o resultado passar do limite do bucket.
    for (const [i, bitrate] of BITRATES.entries()) {
      progresso(i === 0 ? 'Comprimindo vídeo… 0%' : 'Comprimindo mais um pouco… 0%');
      const alvo = new BufferTarget();
      const saida = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: alvo });
      const conversao = await Conversion.init({
        input: entrada,
        output: saida,
        video: { width: largura, height: altura, fit: 'contain', codec: 'avc', bitrate, frameRate, forceTranscode: true },
        audio: { discard: true },
        showWarnings: false,
      });
      if (!conversao.isValid) throw new Error('Não foi possível converter este vídeo.');
      conversao.onProgress = (p) => progresso(`Comprimindo vídeo… ${Math.min(99, Math.round(p * 100))}%`);
      await conversao.execute();
      if (!alvo.buffer) throw new Error('A compressão do vídeo falhou. Tente outro arquivo.');
      const video = new Blob([alvo.buffer], { type: 'video/mp4' });
      if (video.size <= LIMITE_FINAL) {
        return { video, capa, capaTipo, extensaoCapa: capaTipo === 'image/webp' ? 'webp' : 'jpg', duracaoMs: Math.round(duracao * 1000), largura, altura, tamanhoOriginal: arquivo.size };
      }
    }
    throw new Error('O vídeo continua grande demais mesmo comprimido. Use um mais curto.');
  } finally {
    entrada.dispose();
  }
}

export const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
