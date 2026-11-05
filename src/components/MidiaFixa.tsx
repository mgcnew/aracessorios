import type { ArtProps } from '../data/catalog';
import type { MidiaFixa as Item } from '../data/site';
import { Art } from './Art';
import { Midia } from './Midia';
import { VideoFundo } from './VideoFundo';

/** Imagem ou vídeo de um espaço fixo da vitrine; sem nada escolhido nem padrão, a ilustração provisória. */
export function MidiaFixa({
  item,
  tamanho = 'p',
  art,
  ratio = '1 / 1',
  prioridade = false,
}: {
  item: Item | null;
  tamanho?: 'g' | 'p';
  art: ArtProps;
  ratio?: string;
  prioridade?: boolean;
}) {
  if (item?.kind === 'video' && item.poster) {
    return (
      <div className="art foto" style={{ aspectRatio: ratio }}>
        <VideoFundo src={item.src} poster={item.poster} alt={item.alt} />
      </div>
    );
  }
  if (!item) return <Art {...art} ratio={ratio} />;
  return <Midia foto={{ src: item.src, thumb: item.thumb, alt: item.alt }} tamanho={tamanho} art={art} ratio={ratio} prioridade={prioridade} />;
}
