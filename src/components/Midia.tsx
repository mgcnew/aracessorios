import type { ArtProps, Foto } from '../data/catalog';
import { Art } from './Art';

/** Foto do produto quando houver; senão, a ilustração provisória. */
export function Midia({
  foto,
  tamanho = 'p',
  art,
  ratio = '1 / 1',
  rot,
  prioridade = false,
}: {
  foto?: Foto | null;
  tamanho?: 'g' | 'p';
  art: ArtProps;
  ratio?: string;
  rot?: number;
  prioridade?: boolean;
}) {
  if (!foto) return <Art {...art} ratio={ratio} rot={rot} />;
  return (
    <div className="art foto" style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- as versões já saem no tamanho certo do envio */}
      <img
        src={tamanho === 'p' ? foto.thumb : foto.src}
        alt={foto.alt}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={prioridade ? 'high' : 'auto'}
      />
    </div>
  );
}
