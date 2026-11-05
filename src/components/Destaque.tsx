import type { ReactNode } from 'react';

/** Mostra um texto da loja trocando *palavra* por itálico dourado (o `<em>` do tema). */
export function Destaque({ texto }: { texto: string }): ReactNode {
  return texto.split(/(\*[^*]+\*)/).map((parte, i) => (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2 ? <em key={i}>{parte.slice(1, -1)}</em> : parte));
}
