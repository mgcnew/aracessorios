'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Vídeo decorativo da vitrine (destaque, kits, embalagem, sobre): mudo, em repetição, toca sozinho assim que carrega.
 * Com economia de dados ou movimento reduzido ligados, fica só a capa (e um botão de play). Pausa quando sai da tela.
 */
export function VideoFundo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [parado, setParado] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const poupar = conexao?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (poupar) {
      setParado(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => setParado(true));
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className="vfundo">
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={alt} onPlaying={() => setParado(false)} />
      {parado && (
        <button className="vslide-play" onClick={() => void ref.current?.play()} aria-label="Tocar vídeo">
          <span aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
