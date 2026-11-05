'use client';

import { useEffect, useRef, useState } from 'react';
import type { VideoProduto } from '../data/catalog';

/**
 * Vídeo da galeria do produto: mudo, em repetição, toca sozinho quando a pessoa chega nele e pausa quando sai.
 * Só baixa o arquivo quando vai tocar (a capa aparece antes). Com economia de dados ou movimento reduzido ligados,
 * ou se o navegador não deixar tocar sozinho, fica a capa com um botão de play.
 */
export function VideoSlide({ video, nome, ativo }: { video: VideoProduto; nome: string; ativo: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!ativo) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conexao?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setManual(true);
      return;
    }
    v.play().catch(() => setManual(true));
  }, [ativo]);

  return (
    <div className="vslide">
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={`Vídeo de ${nome}`}
        onPlaying={() => {
          setTocando(true);
          setManual(false);
        }}
        onPause={() => setTocando(false)}
      />
      {manual && !tocando && (
        <button className="vslide-play" onClick={() => void ref.current?.play()} aria-label="Tocar vídeo">
          <span aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
