// Tamanhos recomendados para as fotos e vídeos do painel. Os números seguem o que a loja faz de fato:
// a foto grande é reduzida para no máximo 1400 px (TAMANHO_GRANDE em fotos.ts), os cartões de produto usam 4:5
// e a galeria da página do produto é quase quadrada (1:1,05), então a peça deve ficar no centro.
import { TAMANHO_GRANDE } from './fotos';

/** "4 / 5" → "4:5" */
const proporcao = (ratio: string) => ratio.replace(/\s/g, '').replace('/', ':').replace('.', ',');

/** Maior lado em 1400 px, como o envio faz: "4 / 5" → "1120 × 1400 px". */
export function pixelsIdeais(ratio: string): string {
  const [w, h] = ratio.split('/').map((n) => Number(n.trim()));
  const escala = TAMANHO_GRANDE / Math.max(w, h);
  return `${Math.round(w * escala)} × ${Math.round(h * escala)} px`;
}

export const DICA_FOTO_PRODUTO = `Ideal: foto em pé 4:5 (${pixelsIdeais('4 / 5')}) ou quadrada. Mínimo de 400 px no lado menor; acima de ${TAMANHO_GRANDE} px ela é reduzida. Deixe a peça no centro: os cartões da loja usam 4:5 e a página do produto mostra quase quadrado.`;

export const DICA_VIDEO_PRODUTO = 'Ideal: vídeo em pé 4:5 ou quadrado, com 720 px ou mais no lado menor. Fica na página do produto, quase quadrada: deixe a peça no centro.';

/** Dica de um espaço fixo da loja, pela proporção em que ele aparece. */
export function dicaEspaco(ratio: string, aceitaVideo: boolean): string {
  const base = `Ideal: ${proporcao(ratio)}, ${pixelsIdeais(ratio)} (mínimo de 400 px no lado menor).`;
  return aceitaVideo ? `${base} Vídeo: mesma proporção, 720 px ou mais no lado menor.` : base;
}
